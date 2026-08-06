-- ══════════════════════════════════════════════════════════════════════════════
-- RailConnect — Comprehensive Indian Railways Database (50+ Stations, 35+ Trains)
-- ══════════════════════════════════════════════════════════════════════════════

USE railway_reservation;

-- ── 1. STATIONS (50 Major Indian Railway Junctions & Termini) ────────────────
INSERT IGNORE INTO stations (code, name, city, state, zone) VALUES
('NDLS', 'New Delhi',                'New Delhi',     'Delhi',           'NR'),
('HWH',  'Howrah Junction',          'Kolkata',       'West Bengal',     'ER'),
('BCT',  'Mumbai Central',           'Mumbai',        'Maharashtra',     'WR'),
('CSTM', 'Chhatrapati Shivaji Maharaj Terminus', 'Mumbai', 'Maharashtra', 'CR'),
('LTT',  'Lokmanya Tilak Terminus',  'Mumbai',        'Maharashtra',     'CR'),
('MAS',  'Chennai Central',          'Chennai',       'Tamil Nadu',      'SR'),
('SBC',  'KSR Bengaluru City',       'Bengaluru',     'Karnataka',       'SWR'),
('YPR',  'Yesvantpur Junction',      'Bengaluru',     'Karnataka',       'SWR'),
('SC',   'Secunderabad Junction',    'Hyderabad',     'Telangana',       'SCR'),
('HYB',  'Hyderabad Deccan',         'Hyderabad',     'Telangana',       'SCR'),
('ADI',  'Ahmedabad Junction',       'Ahmedabad',     'Gujarat',         'WR'),
('PUNE', 'Pune Junction',            'Pune',          'Maharashtra',     'CR'),
('LKO',  'Lucknow Charbagh',         'Lucknow',       'Uttar Pradesh',   'NR'),
('BSB',  'Varanasi Junction',        'Varanasi',      'Uttar Pradesh',   'NR'),
('JP',   'Jaipur Junction',          'Jaipur',        'Rajasthan',       'NWR'),
('PNBE', 'Patna Junction',           'Patna',         'Bihar',           'ECR'),
('BPL',  'Bhopal Junction',          'Bhopal',        'Madhya Pradesh',  'WCR'),
('INDB', 'Indore Junction',          'Indore',        'Madhya Pradesh',  'WR'),
('ST',   'Surat',                    'Surat',         'Gujarat',         'WR'),
('BRC',  'Vadodara Junction',        'Vadodara',      'Gujarat',         'WR'),
('MAO',  'Madgaon Junction',         'Goa',           'Goa',             'KR'),
('TVC',  'Thiruvananthapuram Central','Thiruvananthapuram', 'Kerala',   'SR'),
('GHY',  'Guwahati',                 'Guwahati',      'Assam',           'NFR'),
('VSKP', 'Visakhapatnam Junction',   'Visakhapatnam', 'Andhra Pradesh',  'ECoR'),
('BBS',  'Bhubaneswar',              'Bhubaneswar',   'Odisha',          'ECoR'),
('RNC',  'Ranchi Junction',          'Ranchi',        'Jharkhand',       'SER'),
('CDG',  'Chandigarh Junction',      'Chandigarh',    'Chandigarh',      'NR'),
('ASR',  'Amritsar Junction',        'Amritsar',      'Punjab',          'NR'),
('JAT',  'Jammu Tawi',               'Jammu',         'Jammu & Kashmir', 'NR'),
('DDN',  'Dehradun',                 'Dehradun',      'Uttarakhand',     'NR'),
('CBE',  'Coimbatore Junction',      'Coimbatore',    'Tamil Nadu',      'SR'),
('MYS',  'Mysuru Junction',          'Mysuru',        'Karnataka',       'SWR'),
('CNB',  'Kanpur Central',           'Kanpur',        'Uttar Pradesh',   'NCR'),
('PRYJ', 'Prayagraj Junction',       'Prayagraj',     'Uttar Pradesh',   'NCR'),
('AGC',  'Agra Cantt',               'Agra',          'Uttar Pradesh',   'NCR'),
('NGP',  'Nagpur Junction',          'Nagpur',        'Maharashtra',     'CR'),
('BZA',  'Vijayawada Junction',      'Vijayawada',    'Andhra Pradesh',  'SCR'),
('GKP',  'Gorakhpur Junction',       'Gorakhpur',     'Uttar Pradesh',   'NER'),
('GWL',  'Gwalior Junction',         'Gwalior',       'Madhya Pradesh',  'NCR'),
('KPD',  'Katpadi Junction',         'Vellore',       'Tamil Nadu',      'SR'),
('UBL',  'SMM Hubballi Junction',    'Hubballi',      'Karnataka',       'SWR'),
('NCJ',  'Nagercoil Junction',       'Nagercoil',     'Tamil Nadu',      'SR'),
('ERS',  'Ernakulam Junction',       'Kochi',         'Kerala',          'SR'),
('REWA', 'Rewa',                     'Rewa',          'Madhya Pradesh',  'WCR'),
('JU',   'Jodhpur Junction',         'Jodhpur',       'Rajasthan',       'NWR'),
('UJR',  'Udaipur City',             'Udaipur',       'Rajasthan',       'NWR'),
('R',    'Raipur Junction',          'Raipur',        'Chhattisgarh',    'SECR'),
('BSP',  'Bilaspur Junction',        'Bilaspur',      'Chhattisgarh',    'SECR'),
('NJP',  'New Jalpaiguri',           'Siliguri',      'West Bengal',     'NFR');

-- ── 2. TRAINS (35+ Iconic Trains Across India) ───────────────────────────────

INSERT IGNORE INTO trains (train_number, train_name, train_type, source_station_id, destination_station_id, departure_time, arrival_time, duration, distance_km, days_of_operation, image_url) VALUES

-- ── Rajdhani Expresses ──
('12301', 'Howrah Rajdhani Express', 'Rajdhani',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='HWH'),
 '16:55', '09:55', '17h 00m', 1531, '1234567', '/trains/rajdhani.png'),

('12951', 'Mumbai Rajdhani Express', 'Rajdhani',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='BCT'),
 '16:25', '08:15', '15h 50m', 1384, '1234567', '/trains/rajdhani.png'),

('22691', 'Bengaluru Rajdhani Express', 'Rajdhani',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='SBC'),
 '20:30', '05:45', '33h 15m', 2444, '1234567', '/trains/rajdhani.png'),

('12434', 'Chennai Rajdhani Express', 'Rajdhani',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='MAS'),
 '15:35', '20:40', '29h 05m', 2176, '35', '/trains/rajdhani.png'),

('12438', 'Secunderabad Rajdhani Express', 'Rajdhani',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='SC'),
 '15:35', '14:00', '22h 25m', 1667, '7', '/trains/rajdhani.png'),

('20504', 'Dibrugarh Rajdhani Express', 'Rajdhani',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='GHY'),
 '11:25', '19:40', '32h 15m', 1906, '1245', '/trains/rajdhani.png'),

-- ── Vande Bharat Expresses ──
('22436', 'Vande Bharat Express (Varanasi)', 'Vande Bharat',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='BSB'),
 '06:00', '14:00', '8h 00m', 759, '123567', '/trains/vande_bharat.png'),

('22439', 'Vande Bharat Express (Katra)', 'Vande Bharat',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='JAT'),
 '06:00', '14:00', '8h 00m', 578, '123567', '/trains/vande_bharat.png'),

('20901', 'Vande Bharat Express (Gandhinagar)', 'Vande Bharat',
 (SELECT id FROM stations WHERE code='BCT'), (SELECT id FROM stations WHERE code='ADI'),
 '06:00', '11:25', '5h 25m', 491, '123457', '/trains/vande_bharat.png'),

('20607', 'Vande Bharat Express (Mysuru)', 'Vande Bharat',
 (SELECT id FROM stations WHERE code='MAS'), (SELECT id FROM stations WHERE code='MYS'),
 '05:50', '12:20', '6h 30m', 500, '134567', '/trains/vande_bharat.png'),

-- ── Shatabdi Expresses ──
('12009', 'Shatabdi Express (Chandigarh)', 'Shatabdi',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='CDG'),
 '07:20', '10:55', '3h 35m', 265, '1234567', '/trains/shatabdi.png'),

('12001', 'Bhopal Shatabdi Express', 'Shatabdi',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='BPL'),
 '06:00', '13:55', '7h 55m', 706, '1234567', '/trains/shatabdi.png'),

('12004', 'Lucknow Shatabdi Express', 'Shatabdi',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='LKO'),
 '06:10', '12:40', '6h 30m', 512, '1234567', '/trains/shatabdi.png'),

('12002', 'New Delhi Shatabdi Express', 'Shatabdi',
 (SELECT id FROM stations WHERE code='BPL'), (SELECT id FROM stations WHERE code='NDLS'),
 '15:15', '23:30', '8h 15m', 706, '1234567', '/trains/shatabdi.png'),

-- ── Duronto Expresses ──
('12269', 'Chennai Duronto Express', 'Duronto',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='MAS'),
 '23:00', '05:25', '30h 25m', 2182, '135', '/trains/duronto.png'),

('12260', 'Howrah Duronto Express', 'Duronto',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='HWH'),
 '19:45', '12:15', '16h 30m', 1441, '1246', '/trains/duronto.png'),

('12268', 'Mumbai Duronto Express', 'Duronto',
 (SELECT id FROM stations WHERE code='ADI'), (SELECT id FROM stations WHERE code='BCT'),
 '23:45', '06:00', '6h 15m', 491, '1234567', '/trains/duronto.png'),

-- ── Superfast & Premium Expresses ──
('12621', 'Tamil Nadu Express', 'Superfast',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='MAS'),
 '22:30', '07:10', '32h 40m', 2182, '1234567', '/trains/express.png'),

('12627', 'Karnataka Express', 'Superfast',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='SBC'),
 '21:00', '10:00', '37h 00m', 2444, '1234567', '/trains/express.png'),

('12723', 'Telangana Express', 'Superfast',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='SC'),
 '06:25', '06:00', '23h 35m', 1740, '1234567', '/trains/express.png'),

('12953', 'August Kranti Tejas Rajdhani', 'Rajdhani',
 (SELECT id FROM stations WHERE code='BCT'), (SELECT id FROM stations WHERE code='NDLS'),
 '17:10', '09:43', '16h 33m', 1377, '1234567', '/trains/rajdhani.png'),

('12802', 'Purushottam Express', 'Superfast',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='BBS'),
 '22:40', '20:00', '21h 20m', 1281, '1234567', '/trains/express.png'),

('12394', 'Sampoorna Kranti Express', 'Superfast',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='PNBE'),
 '19:30', '06:50', '11h 20m', 1003, '1234567', '/trains/express.png'),

('12616', 'Grand Trunk (GT) Express', 'Superfast',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='MAS'),
 '16:10', '04:30', '36h 20m', 2182, '1234567', '/trains/express.png'),

('12138', 'Punjab Mail', 'Mail',
 (SELECT id FROM stations WHERE code='FZR'), (SELECT id FROM stations WHERE code='CSTM'),
 '21:40', '07:35', '33h 55m', 1930, '1234567', '/trains/express.png'),

('12618', 'Mangala Lakshadweep Express', 'Superfast',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='ERS'),
 '05:40', '10:10', '48h 30m', 2768, '1234567', '/trains/express.png'),

('12702', 'Hussain Sagar Express', 'Express',
 (SELECT id FROM stations WHERE code='HYB'), (SELECT id FROM stations WHERE code='CSTM'),
 '14:50', '04:55', '14h 05m', 790, '1234567', '/trains/express.png'),

('12128', 'Mumbai Intercity Express', 'Superfast',
 (SELECT id FROM stations WHERE code='PUNE'), (SELECT id FROM stations WHERE code='CSTM'),
 '17:55', '21:05', '3h 10m', 192, '1234567', '/trains/express.png'),

('12007', 'Chennai Shatabdi Express', 'Shatabdi',
 (SELECT id FROM stations WHERE code='MAS'), (SELECT id FROM stations WHERE code='MYS'),
 '06:00', '13:00', '7h 00m', 500, '1234567', '/trains/shatabdi.png'),

('12650', 'Karnataka Sampark Kranti', 'Superfast',
 (SELECT id FROM stations WHERE code='NZM'), (SELECT id FROM stations WHERE code='YPR'),
 '08:30', '19:30', '35h 00m', 2367, '12467', '/trains/express.png'),

('12424', 'Guwahati Rajdhani Express', 'Rajdhani',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='GHY'),
 '16:20', '20:15', '27h 55m', 1860, '1234567', '/trains/rajdhani.png'),

('11057', 'Amritsar Express', 'Express',
 (SELECT id FROM stations WHERE code='CSTM'), (SELECT id FROM stations WHERE code='ASR'),
 '23:15', '07:25', '32h 10m', 1914, '1234567', '/trains/express.png'),

('12958', 'Swarna Jayanti Rajdhani', 'Rajdhani',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='ADI'),
 '19:55', '08:25', '12h 30m', 934, '1234567', '/trains/rajdhani.png'),

('12217', 'Kerala Sampark Kranti', 'Superfast',
 (SELECT id FROM stations WHERE code='NDLS'), (SELECT id FROM stations WHERE code='TVC'),
 '09:15', '14:30', '53h 15m', 3036, '35', '/trains/express.png'),

('12760', 'Charminar Express', 'Superfast',
 (SELECT id FROM stations WHERE code='HYB'), (SELECT id FROM stations WHERE code='MAS'),
 '18:00', '07:00', '13h 00m', 789, '1234567', '/trains/express.png');

-- ── 3. SEAT CLASSES & FARES FOR ALL TRAINS ───────────────────────────────────

-- Helper insertion loop logic for train classes (4 seats per class)
-- 1A, 2A, 3A for Rajdhanis
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare)
SELECT id, '1A', 'First AC', 4, ROUND(distance_km * 3.2, 0) FROM trains WHERE train_type='Rajdhani';
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare)
SELECT id, '2A', 'Second AC', 4, ROUND(distance_km * 1.9, 0) FROM trains WHERE train_type='Rajdhani';
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare)
SELECT id, '3A', 'Third AC', 4, ROUND(distance_km * 1.35, 0) FROM trains WHERE train_type='Rajdhani';

-- Executive Chair (2A code used as EC) & Chair Car (CC) for Shatabdi & Vande Bharat
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare)
SELECT id, '2A', 'Executive Chair', 4, ROUND(distance_km * 2.8, 0) FROM trains WHERE train_type IN ('Shatabdi', 'Vande Bharat');
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare)
SELECT id, 'CC', 'AC Chair Car', 4, ROUND(distance_km * 1.6, 0) FROM trains WHERE train_type IN ('Shatabdi', 'Vande Bharat');

-- 2A, 3A, SL for Duronto & Superfast & Express & Mail
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare)
SELECT id, '2A', 'Second AC', 4, ROUND(distance_km * 1.65, 0) FROM trains WHERE train_type IN ('Duronto', 'Superfast', 'Express', 'Mail');
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare)
SELECT id, '3A', 'Third AC', 4, ROUND(distance_km * 1.15, 0) FROM trains WHERE train_type IN ('Duronto', 'Superfast', 'Express', 'Mail');
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare)
SELECT id, 'SL', 'Sleeper', 4, ROUND(distance_km * 0.45, 0) FROM trains WHERE train_type IN ('Duronto', 'Superfast', 'Express', 'Mail');
INSERT IGNORE INTO train_classes (train_id, class_code, class_name, total_seats, base_fare)
SELECT id, '2S', 'Second Sitting', 4, ROUND(distance_km * 0.25, 0) FROM trains WHERE train_type IN ('Express', 'Mail');

SELECT 'Comprehensive Indian Railways dataset loaded successfully!' AS status;
SELECT COUNT(*) AS total_stations FROM stations;
SELECT COUNT(*) AS total_trains FROM trains;
SELECT COUNT(*) AS total_classes FROM train_classes;
