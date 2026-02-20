// routes/admin.js
const express = require("express");
const pool = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const usersQ = await pool.query("SELECT COUNT(*) FROM users");
    const devicesQ = await pool.query("SELECT COUNT(*) FROM devices");
    const loginsQ = await pool.query("SELECT COUNT(*) FROM login_logs");
    const visitorsQ = await pool.query("SELECT COUNT(*) FROM device_visits");

    // Logged-in device stats (per user login)
    const deviceDetailsQ = await pool.query(`
      SELECT u.email, d.device_id, d.login_count, d.last_seen
      FROM devices d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.login_count DESC
    `);

    // Visit stats (cookie device_id) + link to user if known
    const visitDetailsQ = await pool.query(`
      SELECT 
        dv.device_id,
        dv.visit_count,
        dv.last_seen,
        u.email
      FROM device_visits dv
      LEFT JOIN users u ON dv.user_id = u.id
      ORDER BY dv.visit_count DESC
      LIMIT 200
    `);

    res.json({
      total_users: Number(usersQ.rows[0].count),
      total_devices: Number(devicesQ.rows[0].count),
      total_logins: Number(loginsQ.rows[0].count),
      total_visitors: Number(visitorsQ.rows[0].count),
      device_stats: deviceDetailsQ.rows,
      visit_stats: visitDetailsQ.rows
    });
  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;