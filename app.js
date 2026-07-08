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
// Leslie - MenuItem
const menuItemRoutes = require("./routes/menuItemRoutes");
app.use("/menuitems", menuItemRoutes);

// Justin - Orders (uncomment when the file exists)
// const orderRoutes = require("./routes/orderRoutes");
// app.use("/orders", orderRoutes);

// Russell - Customer (uncomment when the file exists)
// const customerRoutes = require("./routes/customerRoutes");
// app.use("/customers", customerRoutes);

// Arri - Inspection (uncomment when the file exists)
// const inspectionRoutes = require("./routes/inspectionRoutes");
// app.use("/inspections", inspectionRoutes);

// ---------- Health-check route ----------
app.get("/api", (req, res) => {
  res.json({ message: "HawkerCentreDB API is running" });
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
