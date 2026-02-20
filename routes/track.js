const express = require("express");
const { randomUUID } = require("crypto");
const pool = require("../config/db");
const jwt = require("jsonwebtoken");

const router = express.Router();

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 365
  };
}

router.post("/visit", async (req, res) => {

  try {

    let deviceId = req.cookies.device_id;

    // Create device cookie if new visitor
    if (!deviceId) {
      deviceId = randomUUID();
      res.cookie("device_id", deviceId, cookieOptions());
    }

    // Try detect logged-in user
    let userId = null;

    const token = req.cookies.token;

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        );

        userId = decoded.id;

      } catch (err) {}
    }

    await pool.query(

      `
      INSERT INTO device_visits
      (device_id,user_id,visit_count,last_seen)

      VALUES ($1,$2,1,CURRENT_TIMESTAMP)

      ON CONFLICT (device_id)

      DO UPDATE SET

      visit_count =
      device_visits.visit_count + 1,

      user_id =
      COALESCE(EXCLUDED.user_id,
      device_visits.user_id),

      last_seen = CURRENT_TIMESTAMP
      `,

      [deviceId, userId]

    );

    res.json({
      message:"Visit tracked",
      device_id:deviceId
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message:"Server error"
    });

  }

});

module.exports = router;