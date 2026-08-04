const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// GET /api/stations — all stations
router.get('/', async (req, res) => {
  try {
    const [stations] = await pool.query('SELECT * FROM stations ORDER BY name');
    res.json({ success: true, count: stations.length, stations });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stations.' });
  }
});

// GET /api/stations/search?q=Delhi — search by name or code
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: 'Search query required.' });
  try {
    const [stations] = await pool.query(
      `SELECT * FROM stations 
       WHERE name LIKE ? OR code LIKE ? OR city LIKE ?
       ORDER BY name LIMIT 10`,
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );
    res.json({ success: true, stations });
  } catch (err) {
    res.status(500).json({ message: 'Failed to search stations.' });
  }
});

module.exports = router;
