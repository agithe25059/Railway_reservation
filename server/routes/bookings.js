const express = require('express');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware: Authenticate JWT Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Authentication required.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

// Generate 10-digit unique PNR
const generatePNR = () => {
  const prefix = Math.floor(100 + Math.random() * 900); // 3 digits
  const suffix = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `${prefix}${suffix}`;
};

// Helper: Ensure inventory record exists BEFORE acquiring lock
async function ensureInventoryRecord(poolOrConn, train_id, travel_date, class_code) {
  await poolOrConn.query(
    `INSERT INTO booking_inventory (train_id, travel_date, class_code, total_seats, booked_seats)
     VALUES (?, ?, ?, 4, 0)
     ON DUPLICATE KEY UPDATE total_seats = total_seats`,
    [train_id, travel_date, class_code]
  );
}

// ── 1. POST /api/bookings/reserve (CONCURRENCY-SAFE SEAT BOOKING) ─────────────
router.post('/reserve', authenticateToken, async (req, res) => {
  const { train_id, class_code, travel_date, contact_phone, passengers } = req.body;
  const user_id = req.user.id;

  if (!train_id || !class_code || !travel_date || !passengers || !Array.isArray(passengers) || passengers.length === 0) {
    return res.status(400).json({ message: 'Missing required booking details.' });
  }

  if (!contact_phone || contact_phone.trim().length < 10) {
    return res.status(400).json({ message: 'Please provide a valid 10-digit contact mobile number.' });
  }

  const passenger_count = passengers.length;
  if (passenger_count > 4) {
    return res.status(400).json({ message: 'Maximum 4 passengers allowed per booking.' });
  }

  // Ensure inventory row exists outside transaction first to prevent gap-lock deadlocks
  try {
    await ensureInventoryRecord(pool, train_id, travel_date, class_code);
  } catch (err) {
    // Ignore duplicate key errors if another thread inserted it
  }

  const connection = await pool.getConnection();

  // Retry loop for transient deadlock resolution
  let maxRetries = 3;
  while (maxRetries > 0) {
    try {
      // ── START ACID TRANSACTION ─────────────────────────────────────────────
      await connection.beginTransaction();

      // Fetch train & class details
      const [trainRows] = await connection.query('SELECT * FROM trains WHERE id = ?', [train_id]);
      if (trainRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: 'Train not found.' });
      }
      const train = trainRows[0];

      const [classRows] = await connection.query(
        'SELECT * FROM train_classes WHERE train_id = ? AND class_code = ?',
        [train_id, class_code]
      );
      if (classRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: 'Selected travel class not available on this train.' });
      }
      const trainClass = classRows[0];

      // ── RACE CONDITION GUARD: Exclusive Row Lock FOR UPDATE ────────────────
      const [inventoryRows] = await connection.query(
        `SELECT total_seats, booked_seats 
         FROM booking_inventory 
         WHERE train_id = ? AND travel_date = ? AND class_code = ? 
         FOR UPDATE`,
        [train_id, travel_date, class_code]
      );

      const inventory = inventoryRows[0];
      const capacity = inventory ? inventory.total_seats : 4;
      const currentBooked = inventory ? inventory.booked_seats : 0;
      const availableSeats = capacity - currentBooked;

      // Check if sufficient seats are available
      if (availableSeats < passenger_count) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({
          message: availableSeats <= 0
            ? `Sorry! ${class_code} class is FULLY BOOKED (0/4 available) for this date.`
            : `Only ${availableSeats} seat(s) remaining in ${class_code}. Cannot book for ${passenger_count} passengers.`,
          availableSeats,
        });
      }

      // ── ATOMIC INCREMENT ────────────────────────────────────────────────────
      await connection.query(
        `UPDATE booking_inventory 
         SET booked_seats = booked_seats + ? 
         WHERE train_id = ? AND travel_date = ? AND class_code = ?`,
        [passenger_count, train_id, travel_date, class_code]
      );

      // Calculate total fare
      const total_fare = Number(trainClass.base_fare) * passenger_count;

      // Generate unique PNR
      let pnr = generatePNR();
      let isPnrUnique = false;
      while (!isPnrUnique) {
        const [existingPnr] = await connection.query('SELECT id FROM bookings WHERE pnr = ?', [pnr]);
        if (existingPnr.length === 0) isPnrUnique = true;
        else pnr = generatePNR();
      }

      // Insert Booking Header
      const [bookingResult] = await connection.query(
        `INSERT INTO bookings (pnr, user_id, train_id, class_code, travel_date, passenger_count, total_fare, contact_phone, booking_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
        [pnr, user_id, train_id, class_code, travel_date, passenger_count, total_fare, contact_phone]
      );

      const booking_id = bookingResult.insertId;

      // Assign seat numbers & insert passengers
      const assignedPassengers = [];
      for (let i = 0; i < passenger_count; i++) {
        const seat_number = `${class_code}-${currentBooked + i + 1}`;
        const p = passengers[i];

        await connection.query(
          `INSERT INTO passengers (booking_id, name, age, gender, berth_preference, seat_number)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [booking_id, p.name, parseInt(p.age), p.gender, p.berth_preference || 'No Preference', seat_number]
        );

        assignedPassengers.push({
          name: p.name,
          age: p.age,
          gender: p.gender,
          berth_preference: p.berth_preference || 'No Preference',
          seat_number,
        });
      }

      // ── COMMIT TRANSACTION ─────────────────────────────────────────────────
      await connection.commit();
      connection.release();

      return res.status(201).json({
        success: true,
        message: '🎉 Booking Confirmed Successfully!',
        pnr,
        booking: {
          id: booking_id,
          pnr,
          train_number: train.train_number,
          train_name: train.train_name,
          class_code,
          travel_date,
          contact_phone,
          total_fare,
          passenger_count,
          passengers: assignedPassengers,
        },
      });

    } catch (err) {
      await connection.rollback();

      // If transient deadlock occurred, retry transaction
      if (err.code === 'ER_LOCK_DEADLOCK' && maxRetries > 1) {
        maxRetries--;
        await new Promise(r => setTimeout(r, 50)); // Wait 50ms before retry
        continue;
      }

      connection.release();
      console.error('Reservation Error:', err);
      return res.status(500).json({ message: 'Seat reservation failed due to server error.' });
    }
  }
});

// ── 2. GET /api/bookings/availability ────────────────────────────────────────
// Check real-time remaining seats for a train + class + date
router.get('/availability', async (req, res) => {
  const { train_id, class_code, travel_date } = req.query;
  if (!train_id || !class_code || !travel_date) {
    return res.status(400).json({ message: 'train_id, class_code, and travel_date are required.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT total_seats, booked_seats 
       FROM booking_inventory 
       WHERE train_id = ? AND travel_date = ? AND class_code = ?`,
      [train_id, travel_date, class_code]
    );

    const capacity = rows[0] ? rows[0].total_seats : 4;
    const booked = rows[0] ? rows[0].booked_seats : 0;
    const available = capacity - booked;

    res.json({
      success: true,
      total_seats: capacity,
      booked_seats: booked,
      available_seats: available > 0 ? available : 0,
      status: available > 0 ? `${available} Available` : 'FULLY BOOKED',
    });
  } catch (err) {
    console.error('Availability check error:', err);
    res.status(500).json({ message: 'Failed to fetch availability.' });
  }
});

// ── 3. GET /api/bookings/my-bookings ──────────────────────────────────────────
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const [bookings] = await pool.query(
      `SELECT b.*, t.train_number, t.train_name, t.train_type, t.departure_time, t.arrival_time, t.duration,
              ss.code AS source_code, ss.name AS source_name,
              ds.code AS dest_code, ds.name AS dest_name
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       JOIN stations ss ON t.source_station_id = ss.id
       JOIN stations ds ON t.destination_station_id = ds.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    // Fetch passengers for each booking
    const fullBookings = await Promise.all(bookings.map(async (b) => {
      const [passengers] = await pool.query(
        'SELECT * FROM passengers WHERE booking_id = ? ORDER BY id',
        [b.id]
      );
      return { ...b, passengers };
    }));

    res.json({ success: true, count: fullBookings.length, bookings: fullBookings });
  } catch (err) {
    console.error('My bookings error:', err);
    res.status(500).json({ message: 'Failed to fetch your bookings.' });
  }
});

// ── 4. GET /api/bookings/pnr/:pnr ─────────────────────────────────────────────
router.get('/pnr/:pnr', async (req, res) => {
  const { pnr } = req.params;
  try {
    const [bookings] = await pool.query(
      `SELECT b.*, t.train_number, t.train_name, t.train_type, t.departure_time, t.arrival_time, t.duration,
              ss.code AS source_code, ss.name AS source_name,
              ds.code AS dest_code, ds.name AS dest_name
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       JOIN stations ss ON t.source_station_id = ss.id
       JOIN stations ds ON t.destination_station_id = ds.id
       WHERE b.pnr = ?`,
      [pnr]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Invalid PNR code or booking not found.' });
    }

    const booking = bookings[0];
    const [passengers] = await pool.query('SELECT * FROM passengers WHERE booking_id = ?', [booking.id]);

    res.json({ success: true, booking: { ...booking, passengers } });
  } catch (err) {
    console.error('PNR lookup error:', err);
    res.status(500).json({ message: 'Failed to lookup PNR.' });
  }
});

module.exports = router;
