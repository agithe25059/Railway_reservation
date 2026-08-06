const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './server/.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'railconnect_super_secret_jwt_key_2024';

const createToken = (userId, name) => jwt.sign({ id: userId, email: `user${userId}@test.com`, full_name: name }, JWT_SECRET, { expiresIn: '1h' });

function postBooking(data, token) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings/reserve',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode === 201) {
            resolve({ status: 'SUCCESS', statusCode: res.statusCode, data: parsed });
          } else {
            resolve({ status: 'REJECTED', statusCode: res.statusCode, data: parsed });
          }
        } catch {
          resolve({ status: 'ERROR', statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => resolve({ status: 'ERROR', message: e.message }));
    req.write(postData);
    req.end();
  });
}

function checkAvailability(trainId, classCode, date) {
  return new Promise((resolve) => {
    http.get(`http://localhost:5000/api/bookings/availability?train_id=${trainId}&class_code=${classCode}&travel_date=${date}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
  });
}

async function runConcurrencyTest() {
  console.log('\n🧪 ═══════════════════════════════════════════════════════════════════');
  console.log('   RACE CONDITION & CONCURRENCY TEST FOR SEAT RESERVATION');
  console.log('   Simulating 5 users booking seats at the EXACT SAME MILLISECOND');
  console.log('   Total available seats in class = 4');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const testDate = '2026-09-02';
  const trainId = 1; // Howrah Rajdhani
  const classCode = '1A'; // First AC (4 seats total)

  const requests = [
    { userId: 1, name: 'Alice', phone: '9876543210', passengers: [{ name: 'Alice', age: 28, gender: 'F', berth_preference: 'Lower' }] },
    { userId: 1, name: 'Bob', phone: '9876543211', passengers: [{ name: 'Bob', age: 32, gender: 'M', berth_preference: 'Upper' }] },
    { userId: 1, name: 'Charlie', phone: '9876543212', passengers: [{ name: 'Charlie', age: 25, gender: 'M', berth_preference: 'Middle' }] },
    { userId: 1, name: 'David & Eve', phone: '9876543213', passengers: [{ name: 'David', age: 45, gender: 'M' }, { name: 'Eve', age: 42, gender: 'F' }] }, // 2 passengers! Exceeds remaining 1 seat (total would be 5)
    { userId: 1, name: 'Frank', phone: '9876543214', passengers: [{ name: 'Frank', age: 30, gender: 'M' }] }
  ];

  console.log('🚀 Firing 5 simultaneous HTTP POST /api/bookings/reserve requests via Promise.all()...\n');

  const promises = requests.map((req) => {
    const token = createToken(req.userId, req.name);
    return postBooking({
      train_id: trainId,
      class_code: classCode,
      travel_date: testDate,
      contact_phone: req.phone,
      passengers: req.passengers,
    }, token).then(res => ({ user: req.name, ...res }));
  });

  const results = await Promise.all(promises);

  console.log('📊 CONCURRENCY TEST RESULTS:');
  console.log('───────────────────────────────────────────────────────────────────');
  results.forEach((r, i) => {
    if (r.status === 'SUCCESS') {
      const seats = r.data.booking.passengers.map(p => p.seat_number).join(', ');
      console.log(`✅ [User ${i+1}: ${r.user.padEnd(12)}] CONFIRMED (201) | PNR: ${r.data.pnr} | Assigned Seats: [${seats}]`);
    } else {
      console.log(`❌ [User ${i+1}: ${r.user.padEnd(12)}] REJECTED (${r.statusCode})  | Reason: "${r.data.message}"`);
    }
  });
  console.log('───────────────────────────────────────────────────────────────────\n');

  const checkRes = await checkAvailability(trainId, classCode, testDate);
  console.log(`🔒 INVENTORY CHECK: Total Seats: ${checkRes.total_seats} | Booked Seats: ${checkRes.booked_seats} | Available Seats: ${checkRes.available_seats}`);

  if (checkRes.booked_seats <= 4) {
    console.log('\n🎉 RACE CONDITION TEST PASSED! No overbooking occurred. Database row lock FOR UPDATE worked perfectly! ✅\n');
  } else {
    console.log('\n🚨 TEST FAILED: Overbooking detected! ❌\n');
  }
}

runConcurrencyTest();
