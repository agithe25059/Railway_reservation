-- ══════════════════════════════════════════════════════
-- Railway Reservation — Seed Data: Real Indian Trains
-- ══════════════════════════════════════════════════════

USE railway_reservation;

-- ── Stations ─────────────────────────────────────────
INSERT IGNORE INTO stations (code, name, city, state, zone) VALUES
('NDLS', 'New Delhi',              'New Delhi',   'Delhi',         'NR'),
('HWH',  'Howrah Junction',        'Kolkata',     'West Bengal',   'ER'),
('BCT',  'Mumbai Central',         'Mumbai',      'Maharashtra',   'WR'),
('MAS',  'Chennai Central',        'Chennai',     'Tamil Nadu',    'SR'),
('SBC',  'Bengaluru City Junction','Bengaluru',   'Karnataka',     'SWR'),
('SC',   'Secunderabad Junction',  'Hyderabad',   'Telangana',     'SCR'),
('BPL',  'Bhopal Junction',        'Bhopal',      'Madhya Pradesh','WCR'),
('ASR',  'Amritsar Junction',      'Amritsar',    'Punjab',        'NR'),
('CDG',  'Chandigarh',             'Chandigarh',  'Chandigarh',    'NR'),
('CSTM', 'Chhatrapati Shivaji Terminus', 'Mumbai','Maharashtra',  'CR'),
('CNB',  'Kanpur Central',         'Kanpur',      'Uttar Pradesh', 'NCR'),
('ALD',  'Prayagraj Junction',     'Prayagraj',   'Uttar Pradesh', 'NCR'),
('MGS',  'Mughal Sarai Junction',  'Chandauli',   'Uttar Pradesh', 'ECR'),
('PNBE', 'Patna Junction',         'Patna',       'Bihar',         'ECR'),
('GZB',  'Ghaziabad Junction',     'Ghaziabad',   'Uttar Pradesh', 'NR'),
('AGC',  'Agra Cantt',             'Agra',        'Uttar Pradesh', 'NCR'),
('MTJ',  'Mathura Junction',       'Mathura',     'Uttar Pradesh', 'NCR'),
('ET',   'Itarsi Junction',        'Itarsi',      'Madhya Pradesh','WCR'),
('NGP',  'Nagpur Junction',        'Nagpur',      'Maharashtra',   'SECR'),
('BZA',  'Vijayawada Junction',    'Vijayawada',  'Andhra Pradesh','SCR'),
('GNT',  'Guntur Junction',        'Guntur',      'Andhra Pradesh','SCR'),
('RU',   'Renigunta Junction',     'Tirupati',    'Andhra Pradesh','SCR'),
('JTJ',  'Jolarpettai Junction',   'Jolarpet',    'Tamil Nadu',    'SR'),
('KPD',  'Katpadi Junction',       'Vellore',     'Tamil Nadu',    'SR'),
('YPR',  'Yesvantpur Junction',    'Bengaluru',   'Karnataka',     'SWR'),
('UBL',  'Hubballi Junction',      'Hubballi',    'Karnataka',     'SWR'),
('GTL',  'Guntakal Junction',      'Guntakal',    'Andhra Pradesh','SCR'),
('PUNE', 'Pune Junction',          'Pune',        'Maharashtra',   'CR'),
('LTT',  'Lokmanya Tilak Terminus','Mumbai',      'Maharashtra',   'CR'),
('NCJ',  'Nagercoil Junction',     'Nagercoil',   'Tamil Nadu',    'SR');

-- ── Trains ───────────────────────────────────────────
-- Note: source/destination IDs reference the stations table above

INSERT IGNORE INTO trains (train_number, train_name, train_type, source_station_id, destination_station_id, departure_time, arrival_time, duration, distance_km, days_of_operation, image_url) VALUES
(
  '12301', 'Howrah Rajdhani Express', 'Rajdhani',
  (SELECT id FROM stations WHERE code='NDLS'),
  (SELECT id FROM stations WHERE code='HWH'),
  '16:55', '09:55', '17h 00m', 1531, '1234567',
  '/trains/rajdhani.png'
),
(
  '12951', 'Mumbai Rajdhani Express', 'Rajdhani',
  (SELECT id FROM stations WHERE code='NDLS'),
  (SELECT id FROM stations WHERE code='BCT'),
  '16:25', '08:15', '15h 50m', 1384, '1234567',
  '/trains/rajdhani.png'
),
(
  '12009', 'Shatabdi Express', 'Shatabdi',
  (SELECT id FROM stations WHERE code='NDLS'),
  (SELECT id FROM stations WHERE code='CDG'),
  '07:20', '09:05', '1h 45m', 265, '1234567',
  '/trains/shatabdi.png'
),
(
  '12001', 'Bhopal Shatabdi Express', 'Shatabdi',
  (SELECT id FROM stations WHERE code='NDLS'),
  (SELECT id FROM stations WHERE code='BPL'),
  '06:00', '13:55', '7h 55m', 706, '1234567',
  '/trains/shatabdi.png'
),
(
  '12269', 'Chennai Duronto Express', 'Duronto',
  (SELECT id FROM stations WHERE code='NDLS'),
  (SELECT id FROM stations WHERE code='MAS'),
  '23:00', '05:25', '30h 25m', 2182, '135',
  '/trains/duronto.png'
),
(
  '12621', 'Tamil Nadu Express', 'Superfast',
  (SELECT id FROM stations WHERE code='NDLS'),
  (SELECT id FROM stations WHERE code='MAS'),
  '22:30', '07:10', '32h 40m', 2182, '1234567',
  '/trains/express.png'
),
(
  '12627', 'Karnataka Express', 'Superfast',
  (SELECT id FROM stations WHERE code='NDLS'),
  (SELECT id FROM stations WHERE code='SBC'),
  '21:00', '10:00', '37h 00m', 2444, '1234567',
  '/trains/express.png'
),
(
  '12723', 'Telangana Express', 'Superfast',
  (SELECT id FROM stations WHERE code='NDLS'),
  (SELECT id FROM stations WHERE code='SC'),
  '06:25', '06:00', '23h 35m', 1740, '1234567',
  '/trains/express.png'
),
(
  '11057', 'Amritsar Express', 'Express',
  (SELECT id FROM stations WHERE code='CSTM'),
  (SELECT id FROM stations WHERE code='ASR'),
  '23:15', '07:25', '32h 10m', 1914, '1234567',
  '/trains/express.png'
),
(
  '22691', 'Rajdhani Express (Bengaluru)', 'Rajdhani',
  (SELECT id FROM stations WHERE code='NDLS'),
  (SELECT id FROM stations WHERE code='SBC'),
  '20:30', '05:45', '33h 15m', 2444, '1246',
  '/trains/rajdhani.png'
);

-- ── Train Classes ─────────────────────────────────────

-- 12301 Howrah Rajdhani
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare) VALUES
((SELECT id FROM trains WHERE train_number='12301'), '1A',  'First AC',      24,  4565.00),
((SELECT id FROM trains WHERE train_number='12301'), '2A',  'Second AC',     52,  2600.00),
((SELECT id FROM trains WHERE train_number='12301'), '3A',  'Third AC',     116,  1760.00);

-- 12951 Mumbai Rajdhani
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare) VALUES
((SELECT id FROM trains WHERE train_number='12951'), '1A',  'First AC',      18,  4235.00),
((SELECT id FROM trains WHERE train_number='12951'), '2A',  'Second AC',     46,  2455.00),
((SELECT id FROM trains WHERE train_number='12951'), '3A',  'Third AC',     104,  1680.00);

-- 12009 Shatabdi
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare) VALUES
((SELECT id FROM trains WHERE train_number='12009'), 'CC',  'Chair Car',    210,   475.00),
((SELECT id FROM trains WHERE train_number='12009'), '2A',  'Executive Chair', 56, 915.00);

-- 12001 Bhopal Shatabdi
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare) VALUES
((SELECT id FROM trains WHERE train_number='12001'), 'CC',  'Chair Car',    186,   910.00),
((SELECT id FROM trains WHERE train_number='12001'), '2A',  'Executive Chair', 56, 1735.00);

-- 12269 Duronto
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare) VALUES
((SELECT id FROM trains WHERE train_number='12269'), '2A',  'Second AC',     46,  2950.00),
((SELECT id FROM trains WHERE train_number='12269'), '3A',  'Third AC',     104,  1920.00),
((SELECT id FROM trains WHERE train_number='12269'), 'SL',  'Sleeper',      312,   730.00);

-- 12621 Tamil Nadu Express
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare) VALUES
((SELECT id FROM trains WHERE train_number='12621'), '2A',  'Second AC',     46,  2715.00),
((SELECT id FROM trains WHERE train_number='12621'), '3A',  'Third AC',     104,  1860.00),
((SELECT id FROM trains WHERE train_number='12621'), 'SL',  'Sleeper',      446,   700.00);

-- 12627 Karnataka Express
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare) VALUES
((SELECT id FROM trains WHERE train_number='12627'), '1A',  'First AC',       8,  4810.00),
((SELECT id FROM trains WHERE train_number='12627'), '2A',  'Second AC',     52,  2815.00),
((SELECT id FROM trains WHERE train_number='12627'), '3A',  'Third AC',     104,  1915.00),
((SELECT id FROM trains WHERE train_number='12627'), 'SL',  'Sleeper',      416,   715.00);

-- 12723 Telangana Express
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare) VALUES
((SELECT id FROM trains WHERE train_number='12723'), '2A',  'Second AC',     46,  2250.00),
((SELECT id FROM trains WHERE train_number='12723'), '3A',  'Third AC',     104,  1530.00),
((SELECT id FROM trains WHERE train_number='12723'), 'SL',  'Sleeper',      412,   560.00);

-- 11057 Amritsar Express
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare) VALUES
((SELECT id FROM trains WHERE train_number='11057'), '3A',  'Third AC',     104,  1600.00),
((SELECT id FROM trains WHERE train_number='11057'), 'SL',  'Sleeper',      414,   595.00),
((SELECT id FROM trains WHERE train_number='11057'), '2S',  'Second Sitting',216,  270.00);

-- 22691 Bengaluru Rajdhani
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare) VALUES
((SELECT id FROM trains WHERE train_number='22691'), '1A',  'First AC',      24,  5115.00),
((SELECT id FROM trains WHERE train_number='22691'), '2A',  'Second AC',     52,  2985.00),
((SELECT id FROM trains WHERE train_number='22691'), '3A',  'Third AC',     116,  2020.00);

-- ── Route stops for 12301 (Howrah Rajdhani) ──────────
INSERT IGNORE INTO train_routes (train_id, station_id, stop_number, arrival_time, departure_time, distance_from_source, platform_number, halt_minutes)
SELECT t.id, s.id, 1, NULL, '16:55', 0, 16, 0
FROM trains t, stations s WHERE t.train_number='12301' AND s.code='NDLS';

INSERT IGNORE INTO train_routes (train_id, station_id, stop_number, arrival_time, departure_time, distance_from_source, platform_number, halt_minutes)
SELECT t.id, s.id, 2, '19:52', '19:57', 198, 1, 5
FROM trains t, stations s WHERE t.train_number='12301' AND s.code='CNB';

INSERT IGNORE INTO train_routes (train_id, station_id, stop_number, arrival_time, departure_time, distance_from_source, platform_number, halt_minutes)
SELECT t.id, s.id, 3, '21:30', '21:35', 333, 1, 5
FROM trains t, stations s WHERE t.train_number='12301' AND s.code='ALD';

INSERT IGNORE INTO train_routes (train_id, station_id, stop_number, arrival_time, departure_time, distance_from_source, platform_number, halt_minutes)
SELECT t.id, s.id, 4, '22:55', '23:05', 481, 1, 10
FROM trains t, stations s WHERE t.train_number='12301' AND s.code='MGS';

INSERT IGNORE INTO train_routes (train_id, station_id, stop_number, arrival_time, departure_time, distance_from_source, platform_number, halt_minutes)
SELECT t.id, s.id, 5, '00:40', '00:50', 574, 5, 10
FROM trains t, stations s WHERE t.train_number='12301' AND s.code='PNBE';

INSERT IGNORE INTO train_routes (train_id, station_id, stop_number, arrival_time, departure_time, distance_from_source, platform_number, halt_minutes)
SELECT t.id, s.id, 6, '09:55', NULL, 1531, 9, 0
FROM trains t, stations s WHERE t.train_number='12301' AND s.code='HWH';

SELECT 'Seed data inserted successfully!' AS status;
SELECT COUNT(*) AS total_stations FROM stations;
SELECT COUNT(*) AS total_trains FROM trains;
SELECT COUNT(*) AS total_classes FROM train_classes;
