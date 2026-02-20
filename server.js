// server.js
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const trackRoutes = require("./routes/track");

const app = express();

// If you deploy behind a proxy (Render/NGINX/etc.), this makes req.ip correct
app.set("trust proxy", 1);

// CORS: if you serve frontend from SAME express (public/), this is fine.
// If you use a different origin (e.g. localhost:5173), set FRONTEND_ORIGIN in .env
const allowedOrigin = process.env.FRONTEND_ORIGIN || true;
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

// Track "visits" on page entry
app.use("/api/track", trackRoutes);

// Auth + admin APIs
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));