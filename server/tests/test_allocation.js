require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');
const { allocateSeatsTransaction, findMinSeatChangeDP } = require('../services/seatAllocationService');

async function runTests() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Yesh@2003',
    database: process.env.DB_NAME || 'railway_reservation',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });

  try {
    console.log('--- Setting up test environment ---');
    
    // Clear old allocations for testing
    await pool.query('DELETE FROM seat_allocations WHERE travel_date = "2026-10-10"');
    
    // Assume train_id = 1 is Rajdhani (Delhi to Mumbai)
    // Stops: Delhi (1) -> Kota (2) -> Ratlam (3) -> Vadodara (4) -> Surat (5) -> Mumbai (6)
    const trainId = 1;
    const travelDate = '2026-10-10';
    const classCode = '1A';
    
    // We need real station IDs for train 1
    const [routes] = await pool.query('SELECT station_id, stop_number, (SELECT code FROM stations WHERE id = station_id) as code FROM train_routes WHERE train_id = 1 ORDER BY stop_number');
    
    if (routes.length < 5) {
      console.error('Not enough routes for train 1. Test aborted.');
      return;
    }
    
    const stationA = routes[0].station_id; // NDLS
    const stationC = routes[2].station_id; // RTM
    const stationE = routes[4].station_id; // ST
    const stationF = routes[routes.length - 1].station_id; // BCT

    const connection = await pool.getConnection();
    
    console.log('\n✅ TEST 1: Continuous Allocation');
    await connection.beginTransaction();
    const res1 = await allocateSeatsTransaction(connection, trainId, travelDate, classCode, stationA, stationC, [{ name: 'Pass 1' }]);
    await connection.commit();
    console.log(JSON.stringify(res1, null, 2));
    
    console.log('\n✅ TEST 2: Non-overlapping seat reuse');
    await connection.beginTransaction();
    // Passenger 2 books from C to E. Should reuse the exact same seat as Passenger 1 since Passenger 1 gets off at C.
    const res2 = await allocateSeatsTransaction(connection, trainId, travelDate, classCode, stationC, stationE, [{ name: 'Pass 2' }]);
    await connection.commit();
    console.log(JSON.stringify(res2, null, 2));

    console.log('\n✅ TEST 3: Minimum seat changes (DP logic test)');
    // We will artificially block all seats partially to force a seat change for a long journey A -> E
    // Total seats in 1A is 4. Let's block them manually.
    await connection.beginTransaction();
    await connection.query('INSERT IGNORE INTO seat_allocations (train_id, travel_date, class_code, coach, seat_number, segment_index) VALUES (?, ?, ?, "A1", 1, ?)', [trainId, travelDate, classCode, routes[2].stop_number]); // Blocks A1-1 at segment 2 (C->D)
    await connection.query('INSERT IGNORE INTO seat_allocations (train_id, travel_date, class_code, coach, seat_number, segment_index) VALUES (?, ?, ?, "A1", 2, ?)', [trainId, travelDate, classCode, routes[0].stop_number]); // Blocks A1-2 at segment 0 (A->B)
    await connection.query('INSERT IGNORE INTO seat_allocations (train_id, travel_date, class_code, coach, seat_number, segment_index) VALUES (?, ?, ?, "A1", 3, ?)', [trainId, travelDate, classCode, routes[1].stop_number]); // Blocks A1-3 at segment 1 (B->C)
    await connection.query('INSERT IGNORE INTO seat_allocations (train_id, travel_date, class_code, coach, seat_number, segment_index) VALUES (?, ?, ?, "A1", 4, ?)', [trainId, travelDate, classCode, routes[3].stop_number]); // Blocks A1-4 at segment 3 (D->E)
    await connection.commit();
    
    await connection.beginTransaction();
    // Now book A->E. No single seat is continuously free. DP must find a combo!
    const res3 = await allocateSeatsTransaction(connection, trainId, travelDate, classCode, stationA, stationE, [{ name: 'Pass 3' }]);
    await connection.commit();
    console.log(JSON.stringify(res3, null, 2));
    
    console.log('\n✅ TEST 4: Fully Waitlisted');
    // Block ALL seats for a segment so no path exists
    await connection.beginTransaction();
    await connection.query('INSERT IGNORE INTO seat_allocations (train_id, travel_date, class_code, coach, seat_number, segment_index) VALUES (?, ?, ?, "A1", 1, ?)', [trainId, travelDate, classCode, routes[1].stop_number]);
    await connection.query('INSERT IGNORE INTO seat_allocations (train_id, travel_date, class_code, coach, seat_number, segment_index) VALUES (?, ?, ?, "A1", 2, ?)', [trainId, travelDate, classCode, routes[1].stop_number]);
    await connection.query('INSERT IGNORE INTO seat_allocations (train_id, travel_date, class_code, coach, seat_number, segment_index) VALUES (?, ?, ?, "A1", 3, ?)', [trainId, travelDate, classCode, routes[1].stop_number]);
    await connection.query('INSERT IGNORE INTO seat_allocations (train_id, travel_date, class_code, coach, seat_number, segment_index) VALUES (?, ?, ?, "A1", 4, ?)', [trainId, travelDate, classCode, routes[1].stop_number]);
    await connection.commit();

    await connection.beginTransaction();
    const res4 = await allocateSeatsTransaction(connection, trainId, travelDate, classCode, stationA, stationC, [{ name: 'Pass 4' }]);
    await connection.commit();
    console.log(JSON.stringify(res4, null, 2));

    connection.release();
    console.log('\nAll tests completed successfully!');

  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    pool.end();
  }
}

runTests();
