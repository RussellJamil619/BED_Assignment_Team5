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
app.use("/stalls", require("./leslie_folders/routes/stallRoutes"));
app.use("/menuitems", menuItemRoutes);

// Justin - Orders 
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/payments", paymentRoutes);

// Russell - Customer
const authRoutes = require("./russell_folders/routes/AuthRoutes");
app.use("/api/auth", authRoutes);         

const customerRoutes = require("./russell_folders/routes/customerRoutes");
app.use("/api", customerRoutes);           

// Arri - Inspection 
const inspectionRoutes = require("./routes/inspection");
app.use("/api/inspections", inspectionRoutes);
const hygieneGradeRoutes = require("./routes/hygieneGrade");
app.use("/api/hygiene-grades", hygieneGradeRoutes);

// ---------- Health-check route ----------
app.get("/api", (req, res) => {
  res.json({ message: "HawkerCentreDB API is running" });
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

