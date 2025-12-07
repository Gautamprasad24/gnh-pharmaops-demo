// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const db = require("./db");
// const { spawn } = require("child_process");
// const path = require("path");

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 4000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // ---------- Helper: AI-style expiry risk ----------
// function calculateExpiryRisk(expiryDateStr) {
//   const today = new Date();
//   const exp = new Date(expiryDateStr);
//   const diffMs = exp - today;
//   const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

//   let risk = "Low";
//   if (diffDays < 0) risk = "Expired";
//   else if (diffDays < 90) risk = "High";
//   else if (diffDays < 180) risk = "Medium";

//   let comment;
//   if (risk === "Expired") {
//     comment = "Batch already expired. Remove from inventory.";
//   } else if (risk === "High") {
//     comment = "Expiry is near, prioritize dispatch or discount.";
//   } else if (risk === "Medium") {
//     comment = "Monitor movement and adjust planning.";
//   } else {
//     comment = "Stock is safe for now.";
//   }

//   return { riskLevel: risk, daysToExpiry: diffDays, comment };
// }

// // ---------- Routes ----------

// // Health check
// app.get("/", async (req, res) => {
//   try {
//     await db.query("SELECT 1"); // sanity check
//     res.json({ message: "GNH Pharma Demo API is running with MySQL ✅" });
//   } catch (err) {
//     console.error("DB health check failed:", err);
//     res.status(500).json({ error: "Database connection error" });
//   }
// });

// // Get all medicines
// app.get("/api/medicines", async (req, res) => {
//   try {
//     const [rows] = await db.query(
//       "SELECT id, name, batch_no AS batchNo, stock, expiry_date AS expiryDate, category, created_at AS createdAt FROM medicines ORDER BY created_at DESC"
//     );
//     res.json(rows);
//   } catch (err) {
//     console.error("Error fetching medicines:", err);
//     res.status(500).json({ error: "Failed to fetch medicines" });
//   }
// });

// // Add new medicine
// app.post("/api/medicines", async (req, res) => {
//   try {
//     const { name, batchNo, stock, expiryDate, category } = req.body;

//     if (!name || !batchNo || !stock || !expiryDate) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const [result] = await db.query(
//       "INSERT INTO medicines (name, batch_no, stock, expiry_date, category) VALUES (?, ?, ?, ?, ?)",
//       [name, batchNo, Number(stock), expiryDate, category || null]
//     );

//     const [rows] = await db.query(
//       "SELECT id, name, batch_no AS batchNo, stock, expiry_date AS expiryDate, category, created_at AS createdAt FROM medicines WHERE id = ?",
//       [result.insertId]
//     );

//     res.status(201).json(rows[0]);
//   } catch (err) {
//     console.error("Error inserting medicine:", err);
//     res.status(500).json({ error: "Failed to save medicine" });
//   }
// });

// // Get all orders
// app.get("/api/orders", async (req, res) => {
//   try {
//     const [rows] = await db.query(
//       "SELECT id, hospital, medicine_name AS medicineName, quantity, status, created_at AS createdAt FROM orders ORDER BY created_at DESC"
//     );
//     res.json(rows);
//   } catch (err) {
//     console.error("Error fetching orders:", err);
//     res.status(500).json({ error: "Failed to fetch orders" });
//   }
// });

// // Add new order
// app.post("/api/orders", async (req, res) => {
//   try {
//     const { hospital, medicineName, quantity } = req.body;

//     if (!hospital || !medicineName || !quantity) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const [result] = await db.query(
//       "INSERT INTO orders (hospital, medicine_name, quantity) VALUES (?, ?, ?)",
//       [hospital, medicineName, Number(quantity)]
//     );

//     const [rows] = await db.query(
//       "SELECT id, hospital, medicine_name AS medicineName, quantity, status, created_at AS createdAt FROM orders WHERE id = ?",
//       [result.insertId]
//     );

//     res.status(201).json(rows[0]);
//   } catch (err) {
//     console.error("Error creating order:", err);
//     res.status(500).json({ error: "Failed to create order" });
//   }
// });

// // Optional: update order status (enhancement)
// app.patch("/api/orders/:id/status", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body; // 'Pending' | 'Dispatched' | 'Cancelled'

//     if (!["Pending", "Dispatched", "Cancelled"].includes(status)) {
//       return res.status(400).json({ error: "Invalid status" });
//     }

//     await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

//     const [rows] = await db.query(
//       "SELECT id, hospital, medicine_name AS medicineName, quantity, status, created_at AS createdAt FROM orders WHERE id = ?",
//       [id]
//     );

//     res.json(rows[0]);
//   } catch (err) {
//     console.error("Error updating order status:", err);
//     res.status(500).json({ error: "Failed to update status" });
//   }
// });

// // AI-style expiry risk (Node side)
// app.post("/api/ai/expiry-risk", async (req, res) => {
//   try {
//     const { expiryDate } = req.body;

//     if (!expiryDate) {
//       return res.status(400).json({ error: "expiryDate is required (YYYY-MM-DD)" });
//     }

//     const { riskLevel, daysToExpiry, comment } = calculateExpiryRisk(expiryDate);

//     res.json({
//       expiryDate,
//       daysToExpiry,
//       riskLevel,
//       comment
//     });
//   } catch (err) {
//     console.error("Error calculating AI risk:", err);
//     res.status(500).json({ error: "Failed to calculate expiry risk" });
//   }
// });
// // ML-style risk using Python script
// app.post("/api/ai/expiry-risk-ml", async (req, res) => {
//   const { expiryDate } = req.body;

//   if (!expiryDate) {
//     return res.status(400).json({ error: "expiryDate is required (YYYY-MM-DD)" });
//   }

//   const scriptPath = path.join(__dirname, "..", "ai_tools", "expiry_risk_ml.py");

//   const py = spawn("python", [scriptPath, expiryDate]);

//   let dataBuffer = "";
//   let errorBuffer = "";

//   py.stdout.on("data", (chunk) => {
//     dataBuffer += chunk.toString();
//   });

//   py.stderr.on("data", (chunk) => {
//     errorBuffer += chunk.toString();
//   });

//   py.on("close", (code) => {
//     if (code !== 0 || errorBuffer) {
//       console.error("Python script error:", errorBuffer);
//       return res.status(500).json({ error: "ML risk script failed" });
//     }

//     try {
//       const parsed = JSON.parse(dataBuffer);
//       res.json(parsed);
//     } catch (err) {
//       console.error("Failed to parse Python output:", err);
//       res.status(500).json({ error: "Invalid ML response" });
//     }
//   });
// });


// // Start server
// app.listen(PORT, () => {
//   console.log(`GNH Pharma Demo API with MySQL running on http://localhost:${PORT}`);
// });



const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// ---------- Helper: AI-style expiry risk ----------
function calculateExpiryRisk(expiryDateStr) {
  const today = new Date();
  const exp = new Date(expiryDateStr);
  const diffMs = exp - today;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let risk = "Low";
  if (diffDays < 0) risk = "Expired";
  else if (diffDays < 90) risk = "High";
  else if (diffDays < 180) risk = "Medium";

  let comment;
  if (risk === "Expired") {
    comment = "Batch already expired. Remove from inventory.";
  } else if (risk === "High") {
    comment = "Expiry is near, prioritize dispatch or discount.";
  } else if (risk === "Medium") {
    comment = "Monitor movement and adjust planning.";
  } else {
    comment = "Stock is safe for now.";
  }

  return { riskLevel: risk, daysToExpiry: diffDays, comment };
}

// ---------- Routes ----------

// Health check
app.get("/", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ message: "GNH Pharma Demo API is running with MySQL ✅" });
  } catch (err) {
    console.error("DB health check failed:", err);
    res.status(500).json({ error: "Database connection error" });
  }
});

// Get all medicines
app.get("/api/medicines", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, batch_no AS batchNo, stock, expiry_date AS expiryDate, category, created_at AS createdAt FROM medicines ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching medicines:", err);
    res.status(500).json({ error: "Failed to fetch medicines" });
  }
});

// Add new medicine
app.post("/api/medicines", async (req, res) => {
  try {
    const { name, batchNo, stock, expiryDate, category } = req.body;

    if (!name || !batchNo || !stock || !expiryDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [result] = await db.query(
      "INSERT INTO medicines (name, batch_no, stock, expiry_date, category) VALUES (?, ?, ?, ?, ?)",
      [name, batchNo, Number(stock), expiryDate, category || null]
    );

    const [rows] = await db.query(
      "SELECT id, name, batch_no AS batchNo, stock, expiry_date AS expiryDate, category, created_at AS createdAt FROM medicines WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error inserting medicine:", err);
    res.status(500).json({ error: "Failed to save medicine" });
  }
});

// Get all orders
app.get("/api/orders", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, hospital, medicine_name AS medicineName, quantity, status, created_at AS createdAt FROM orders ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Add new order
app.post("/api/orders", async (req, res) => {
  try {
    const { hospital, medicineName, quantity } = req.body;

    if (!hospital || !medicineName || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [result] = await db.query(
      "INSERT INTO orders (hospital, medicine_name, quantity) VALUES (?, ?, ?)",
      [hospital, medicineName, Number(quantity)]
    );

    const [rows] = await db.query(
      "SELECT id, hospital, medicine_name AS medicineName, quantity, status, created_at AS createdAt FROM orders WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Update order status
app.patch("/api/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Pending", "Dispatched", "Cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

    const [rows] = await db.query(
      "SELECT id, hospital, medicine_name AS medicineName, quantity, status, created_at AS createdAt FROM orders WHERE id = ?",
      [id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// AI-style expiry risk (Node version)
app.post("/api/ai/expiry-risk", async (req, res) => {
  try {
    const { expiryDate } = req.body;

    if (!expiryDate) {
      return res.status(400).json({ error: "expiryDate is required (YYYY-MM-DD)" });
    }

    const { riskLevel, daysToExpiry, comment } = calculateExpiryRisk(expiryDate);

    res.json({
      expiryDate,
      daysToExpiry,
      riskLevel,
      comment
    });
  } catch (err) {
    console.error("Error calculating AI risk:", err);
    res.status(500).json({ error: "Failed to calculate expiry risk" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`GNH Pharma Demo API with MySQL running on port ${PORT}`);
});
