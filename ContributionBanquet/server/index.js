const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const pool = require("./db");

const app = express();
const server = http.createServer(app);

/* =========================
   SERVER CONFIGURATION
========================= */

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:4000";

/* =========================
   SOCKET.IO
========================= */

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

/* =========================
   MIDDLEWARE
========================= */

app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

/* =========================
   ROOT API
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Speed Moi API is running",
    frontend: CLIENT_URL,
    backend: `http://localhost:${PORT}`,
  });
});

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      success: true,
      message: "Speed Moi backend is working",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health error:", error);

    res.status(500).json({
      success: false,
      message: "Backend working, but database connection failed",
      database: "disconnected",
      error: error.message,
    });
  }
});

/* =========================
   CREATE LOGIN / SESSION
========================= */

app.post("/api/sessions", async (req, res) => {
  try {
    const username = typeof req.body?.username === "string"
      ? req.body.username.trim()
      : "";
    const functionName = typeof req.body?.functionName === "string"
      ? req.body.functionName.trim()
      : typeof req.body?.function_name === "string"
        ? req.body.function_name.trim()
        : "";

    console.log("=================================");
    console.log("SESSION REQUEST");
    console.log("Username:", username);
    console.log("Function:", functionName);
    console.log("=================================");

    if (!username || !functionName) {
      return res.status(400).json({
        success: false,
        message: "Username and function name are required",
      });
    }

    const existingFunction = await pool.query(
      `SELECT id, function_name
       FROM public.functions
       WHERE function_name = $1
       LIMIT 1`,
      [functionName]
    );

    let functionId = existingFunction.rows[0]?.id;

    if (!functionId) {
      const functionResult = await pool.query(
        `INSERT INTO public.functions (function_name)
         VALUES ($1)
         ON CONFLICT (function_name) DO NOTHING
         RETURNING id, function_name`,
        [functionName]
      );

      functionId = functionResult.rows[0]?.id || (
        await pool.query(
          `SELECT id FROM public.functions WHERE function_name = $1 LIMIT 1`,
          [functionName]
        )
      ).rows[0].id;
    }

    const userResult = await pool.query(
      `INSERT INTO public.users (username, function_name)
       VALUES ($1, $2)
       RETURNING id, username, function_name`,
      [username, functionName]
    );

    const session = {
      id: userResult.rows[0].id,
      username: userResult.rows[0].username,
      functionId,
      functionName: userResult.rows[0].function_name,
    };

    console.log("Session created successfully:", session);

    res.status(201).json({
      success: true,
      message: "Session created successfully",
      session,
    });
  } catch (error) {
    console.error("=================================");
    console.error("SESSION ERROR");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Detail:", error.detail);
    console.error("Hint:", error.hint);
    console.error("=================================");

    res.status(500).json({
      success: false,
      message: "Could not create session",
      error: error.message,
      code: error.code,
      detail: error.detail || null,
    });
  }
});

/* =========================
   SAVE CONTRIBUTION
========================= */

app.post("/api/contributions", async (req, res) => {
  try {
    const {
      userId,
      functionId,
      name,
      city,
      giftAmount,
      voiceTranscript,
    } = req.body;

    const finalVoiceTranscript = voiceTranscript ?? "";

    console.log("Contribution request:", req.body);

    if (!name || !city || !giftAmount) {
      return res.status(400).json({
        success: false,
        message: "Name, city and gift amount are required",
      });
    }

    const resolvedFunctionId = functionId ?? req.body?.function_id ?? null;

    let createdBy = req.body?.createdBy ?? req.body?.username ?? null;
    if (!createdBy && userId) {
      const userLookup = await pool.query(
        `SELECT username FROM public.users WHERE id = $1 LIMIT 1`,
        [userId]
      );
      createdBy = userLookup.rows[0]?.username || null;
    }

    if (!resolvedFunctionId) {
      return res.status(400).json({
        success: false,
        message: "Function id is required",
      });
    }

    const result = await pool.query(
      `INSERT INTO public.contributions
       (
         function_id,
         name,
         city,
         gift_amount,
         voice_transcript,
         entry_date,
         entry_time,
         created_by
       )
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_TIME, $6)
       RETURNING *`,
      [
        resolvedFunctionId,
        name,
        city,
        giftAmount,
        finalVoiceTranscript,
        createdBy || "system",
      ]
    );

    const contribution = result.rows[0];

    console.log("Contribution saved:", contribution);

    io.emit("contribution:created", contribution);

    res.status(201).json({
      success: true,
      message: "Contribution saved successfully",
      contribution,
    });
  } catch (error) {
    console.error("=================================");
    console.error("CONTRIBUTION ERROR");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Detail:", error.detail);
    console.error("Hint:", error.hint);
    console.error("=================================");

    res.status(500).json({
      success: false,
      message: "Could not save contribution",
      error: error.message,
      code: error.code,
      detail: error.detail || null,
    });
  }
});

/* =========================
   GET ALL CONTRIBUTIONS
========================= */

app.get("/api/contributions", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.city,
        c.gift_amount,
        c.voice_transcript,
        c.entry_date,
        c.entry_time,
        c.created_at,
        c.created_by,
        f.function_name
      FROM public.contributions c
      LEFT JOIN public.functions f
        ON c.function_id = f.id
      ORDER BY c.created_at DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      contributions: result.rows,
    });
  } catch (error) {
    console.error("Get contributions error:", error);

    res.status(500).json({
      success: false,
      message: "Could not fetch contributions",
      error: error.message,
    });
  }
});

/* =========================
   GET ONE CONTRIBUTION
========================= */

app.get("/api/contributions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.name,
        c.city,
        c.gift_amount,
        c.voice_transcript,
        c.entry_date,
        c.entry_time,
        c.created_at,
        c.created_by,
        u.username,
        f.function_name
      FROM public.contributions c
      LEFT JOIN public.users u
        ON c.created_by = u.username
      LEFT JOIN public.functions f
        ON c.function_id = f.id
      WHERE c.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contribution not found",
      });
    }

    res.json({
      success: true,
      contribution: result.rows[0],
    });
  } catch (error) {
    console.error("Get contribution error:", error);

    res.status(500).json({
      success: false,
      message: "Could not fetch contribution",
      error: error.message,
    });
  }
});

/* =========================
   SOCKET.IO CONNECTION
========================= */

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
  });
});

/* =========================
   START SERVER
========================= */

server.listen(PORT, () => {
  console.log("=================================");
  console.log(`Speed Moi API running on http://localhost:${PORT}`);
  console.log(`Frontend allowed: ${CLIENT_URL}`);
  console.log("=================================");
});