// Auth controller - register + login
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../models/customerModel"); // Russell's class

async function register(req, res) {
  console.log(">>> MY authController register HIT, body =", req.body);
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    const existing = await Customer.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const customer = await Customer.createCustomer({
      name,
      email,
      password_hash: hashed,
      phone,
    });
    return res.status(201).json({ message: "Customer registered", customer });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ error: "REAL ERROR: " + err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const customer = await Customer.findByEmail(email);
    if (!customer) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, customer.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: customer.customer_id, customer_id: customer.customer_id, email: customer.email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    return res.status(200).json({ token });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
}

module.exports = { register, login };