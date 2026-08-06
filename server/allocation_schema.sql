-- ══════════════════════════════════════════════════════════════════════════════
-- Railway Reservation — Segment-Based Allocation Schema
-- ══════════════════════════════════════════════════════════════════════════════

USE railway_reservation;

-- Table to track physical seat availability on a per-segment basis
CREATE TABLE IF NOT EXISTS seat_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  train_id INT NOT NULL,
  travel_date DATE NOT NULL,
  class_code VARCHAR(10) NOT NULL,
  coach VARCHAR(10) NOT NULL,
  seat_number INT NOT NULL,
  segment_index INT NOT NULL,
  booking_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_seat_segment (train_id, travel_date, class_code, coach, seat_number, segment_index)
);

SELECT 'Segment allocation schema created successfully!' AS status;
