// app.js - Team backend entry point for HawkerCentreDB API
require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware (must come BEFORE routes) ----------
app.use(express.json());                                  // parse JSON request bodies
app.use(express.static(path.join(__dirname, "public")));  // serve index.html, credit.html

// ---------- Feature routes ----------

// Leslie - MenuItem (moved into leslie_folders)
const menuItemRoutes = require("./leslie_folders/routes/menuItemRoutes");
app.use("/menuitems", menuItemRoutes);

// Leslie - future features (uncomment as each is built)
// app.use("/stalls", require("./leslie_folders/routes/stallRoutes"));
// app.use("/cuisines", require("./leslie_folders/routes/cuisineRoutes"));
// app.use("/promotions", require("./leslie_folders/routes/promotionRoutes"));

// Justin - Cart, Orders & Payments
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/payments", paymentRoutes);

// Russell - Auth & Customer
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);          // auth routes FIRST

const customerRoutes = require("./routes/customerRoutes");
app.use("/api", customerRoutes);           // customer routes after

// Arri - Inspection
const inspectionRoutes = require("./routes/inspection");
app.use("/api/inspections", inspectionRoutes);

// ---------- Health-check route ----------
app.get("/api", (req, res) => {
  res.json({ message: "HawkerCentreDB API is running" });
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});