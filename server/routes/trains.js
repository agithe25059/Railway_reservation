const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// ── GET all trains (with optional filters) ────────────
// GET /api/trains?type=Rajdhani&limit=20
router.get('/', async (req, res) => {
  const { type, limit = 50 } = req.query;
  try {
    let query = `
      SELECT t.*, 
        ss.code AS source_code, ss.name AS source_name, ss.city AS source_city,
        ds.code AS dest_code, ds.name AS dest_name, ds.city AS dest_city
      FROM trains t
      JOIN stations ss ON t.source_station_id = ss.id
      JOIN stations ds ON t.destination_station_id = ds.id
      WHERE t.is_active = 1
    `;
    const params = [];
    if (type) { query += ' AND t.train_type = ?'; params.push(type); }
    query += ' ORDER BY t.train_number LIMIT ?';
    params.push(parseInt(limit));

    const [trains] = await pool.query(query, params);
    res.json({ success: true, count: trains.length, trains });
  } catch (err) {
    console.error('GET /trains error:', err);
    res.status(500).json({ message: 'Failed to fetch trains.' });
  }
});

// ── SEARCH trains by source → destination ─────────────
// GET /api/trains/search?from=NDLS&to=MAS&date=2024-08-15
router.get('/search', async (req, res) => {
  const { from, to, date } = req.query;
  if (!from || !to) return res.status(400).json({ message: 'from and to station codes are required.' });

  try {
    const [trains] = await pool.query(`
      SELECT t.*,
        ss.code AS source_code, ss.name AS source_name, ss.city AS source_city,
        ds.code AS dest_code, ds.name AS dest_name, ds.city AS dest_city
      FROM trains t
      JOIN stations ss ON t.source_station_id = ss.id
      JOIN stations ds ON t.destination_station_id = ds.id
      WHERE ss.code = ? AND ds.code = ? AND t.is_active = 1
      ORDER BY t.departure_time
    `, [from.toUpperCase(), to.toUpperCase()]);

    // Attach classes for each train
    const trainsWithClasses = await Promise.all(trains.map(async (train) => {
      const [classes] = await pool.query(
        'SELECT * FROM train_classes WHERE train_id = ? ORDER BY base_fare DESC',
        [train.id]
      );
      return { ...train, classes };
    }));

    res.json({ success: true, count: trainsWithClasses.length, trains: trainsWithClasses, date: date || null });
  } catch (err) {
    console.error('Search trains error:', err);
    res.status(500).json({ message: 'Failed to search trains.' });
  }
});

// ── GET single train by number ────────────────────────
// GET /api/trains/:number
router.get('/:number', async (req, res) => {
  const { number } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT t.*,
        ss.code AS source_code, ss.name AS source_name, ss.city AS source_city,
        ds.code AS dest_code, ds.name AS dest_name, ds.city AS dest_city
      FROM trains t
      JOIN stations ss ON t.source_station_id = ss.id
      JOIN stations ds ON t.destination_station_id = ds.id
      WHERE t.train_number = ?
    `, [number]);

    if (rows.length === 0) return res.status(404).json({ message: 'Train not found.' });

    const train = rows[0];
    const [classes] = await pool.query(
      'SELECT * FROM train_classes WHERE train_id = ? ORDER BY base_fare DESC', [train.id]
    );

    res.json({ success: true, train: { ...train, classes } });
  } catch (err) {
    console.error('GET train error:', err);
    res.status(500).json({ message: 'Failed to fetch train details.' });
  }
});

// ── GET train schedule (all stops) ───────────────────
// GET /api/trains/:number/schedule
router.get('/:number/schedule', async (req, res) => {
  const { number } = req.params;
  try {
    const [train] = await pool.query('SELECT id FROM trains WHERE train_number = ?', [number]);
    if (train.length === 0) return res.status(404).json({ message: 'Train not found.' });

    const [schedule] = await pool.query(`
      SELECT tr.*, s.code, s.name AS station_name, s.city, s.state
      FROM train_routes tr
      JOIN stations s ON tr.station_id = s.id
      WHERE tr.train_id = ?
      ORDER BY tr.stop_number
    `, [train[0].id]);

    res.json({ success: true, train_number: number, stops: schedule });
  } catch (err) {
    console.error('Schedule error:', err);
    res.status(500).json({ message: 'Failed to fetch schedule.' });
  }
});

module.exports = router;
