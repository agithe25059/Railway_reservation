-- ══════════════════════════════════════════════════════════════════════════════
-- Railway Reservation — Step 3: Booking, Passengers & Inventory Schema
-- ══════════════════════════════════════════════════════════════════════════════

USE railway_reservation;

-- ── 1. Date-Wise Seat Inventory ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  train_id INT NOT NULL,
  travel_date DATE NOT NULL,
  class_code VARCHAR(10) NOT NULL,
  total_seats INT NOT NULL DEFAULT 4,
  booked_seats INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE,
  UNIQUE KEY unique_train_date_class (train_id, travel_date, class_code)
);

-- ── 2. Bookings (Tickets) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pnr VARCHAR(10) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  train_id INT NOT NULL,
  class_code VARCHAR(10) NOT NULL,
  travel_date DATE NOT NULL,
  passenger_count INT NOT NULL,
  total_fare DECIMAL(10, 2) NOT NULL,
  contact_phone VARCHAR(15) NOT NULL,
  booking_status ENUM('CONFIRMED', 'CANCELLED') DEFAULT 'CONFIRMED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (train_id) REFERENCES trains(id)
);

-- ── 3. Passengers ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS passengers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  gender ENUM('M', 'F', 'O') NOT NULL,
  berth_preference VARCHAR(30) DEFAULT 'No Preference',
  seat_number VARCHAR(15) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

SELECT 'Booking tables created successfully!' AS status;
