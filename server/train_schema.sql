-- ══════════════════════════════════════════════════════
-- Railway Reservation — Step 2: Train Info Schema
-- ══════════════════════════════════════════════════════

USE railway_reservation;

-- ── Stations ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Trains ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trains (
  id INT AUTO_INCREMENT PRIMARY KEY,
  train_number VARCHAR(10) UNIQUE NOT NULL,
  train_name VARCHAR(150) NOT NULL,
  train_type ENUM('Rajdhani','Shatabdi','Duronto','Vande Bharat','Superfast','Express','Mail','Passenger','Local') NOT NULL,
  source_station_id INT NOT NULL,
  destination_station_id INT NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  duration VARCHAR(20) NOT NULL,
  distance_km INT NOT NULL,
  days_of_operation VARCHAR(20) NOT NULL COMMENT 'e.g. 1234567 = all days, 135 = Mon,Wed,Fri',
  image_url VARCHAR(255) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_station_id) REFERENCES stations(id),
  FOREIGN KEY (destination_station_id) REFERENCES stations(id)
);

-- ── Train Routes (intermediate stops) ────────────────
CREATE TABLE IF NOT EXISTS train_routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  train_id INT NOT NULL,
  station_id INT NOT NULL,
  stop_number INT NOT NULL,
  arrival_time TIME,
  departure_time TIME,
  distance_from_source INT DEFAULT 0,
  platform_number INT DEFAULT 1,
  halt_minutes INT DEFAULT 0,
  FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE,
  FOREIGN KEY (station_id) REFERENCES stations(id),
  UNIQUE KEY unique_train_stop (train_id, stop_number)
);

-- ── Train Classes (seat classes per train) ────────────
CREATE TABLE IF NOT EXISTS train_classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  train_id INT NOT NULL,
  class_code ENUM('1A','2A','3A','SL','CC','2S','GN') NOT NULL,
  class_name VARCHAR(60) NOT NULL,
  total_seats INT NOT NULL DEFAULT 0,
  base_fare DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE,
  UNIQUE KEY unique_train_class (train_id, class_code)
);

SELECT 'Train schema created successfully!' AS status;
