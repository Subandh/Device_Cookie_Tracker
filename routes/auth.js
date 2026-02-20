// routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

function tokenCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  };
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email))
      return res.status(400).json({ message: "Invalid email" });

    if (typeof password !== "string" || password.length < 6)
      return res.status(400).json({ message: "Password must be 6+ chars" });

    // Check duplicate email
    const exists = await pool.query("SELECT 1 FROM users WHERE email=$1", [
      email,
    ]);
    if (exists.rows.length > 0)
      return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    await pool.query("INSERT INTO users (email, password_hash) VALUES ($1,$2)", [
      email,
      hashed,
    ]);

    res.json({ message: "User registered" });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, device_id } = req.body;

    if (!isValidEmail(email))
      return res.status(400).json({ message: "Invalid email" });

    if (!device_id || typeof device_id !== "string")
      return res.status(400).json({ message: "device_id is required" });

    const userQuery = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    if (userQuery.rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    const user = userQuery.rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Insert or update device per user login (your existing logic)
    const deviceCheck = await pool.query(
      "SELECT * FROM devices WHERE user_id=$1 AND device_id=$2",
      [user.id, device_id]
    );

    if (deviceCheck.rows.length === 0) {
      await pool.query(
        "INSERT INTO devices (user_id, device_id, login_count) VALUES ($1,$2,1)",
        [user.id, device_id]
      );
    } else {
      await pool.query(
        "UPDATE devices SET login_count = login_count + 1, last_seen = CURRENT_TIMESTAMP WHERE user_id=$1 AND device_id=$2",
        [user.id, device_id]
      );
    }

    await pool.query(
      "INSERT INTO login_logs (user_id, device_id, ip_address) VALUES ($1,$2,$3)",
      [user.id, device_id, req.ip]
    );

    // Set auth cookie
    res.cookie("token", token, tokenCookieOptions());

    res.json({
      message: "Login successful",
      role: user.role,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  // Clears JWT cookie
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
  });
  res.json({ message: "Logged out" });
});

module.exports = router;