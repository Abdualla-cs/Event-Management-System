const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= DATABASE ================= */

const poolConfig = {
    host: process.env.PGHOST || "aws-1-ap-southeast-1.pooler.supabase.com",
    port: parseInt(process.env.PGPORT) || 6543,
    user: process.env.PGUSER || "postgres.bsqznbssksnecndcjzbc",
    password: process.env.PGPASSWORD
        ? decodeURIComponent(process.env.PGPASSWORD)
        : "abdalla@3082006@",
    database: process.env.PGDATABASE || "postgres",
    ssl: { rejectUnauthorized: false, require: true },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

const pool = new Pool(poolConfig);

pool.connect()
    .then(client => {
        console.log("✅ Connected to Supabase");
        client.release();
    })
    .catch(err => console.error("❌ DB connection error:", err));

/* ================= FILE UPLOAD ================= */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "/tmp/uploads/";
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const id = req.params.id || "temp";
        cb(null, `event_${id}_${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
});

app.use("/uploads", express.static("/tmp/uploads"));

/* ================= AUTH ================= */

const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied" });

    jwt.verify(token, process.env.JWT_SECRET || "yalla-event-secret", (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
};

/* ================= HELPERS ================= */

const formatEvent = event => ({
    ...event,
    date: new Date(event.date).toISOString().split("T")[0],
    image_url: event.image_filename ? `/uploads/${event.image_filename}` : null,
    registration_count: parseInt(event.registration_count || 0),
});

const formatPendingEvent = event => ({
    ...event,
    date: new Date(event.date).toISOString().split("T")[0],
    image_url: event.image_filename ? `/uploads/${event.image_filename}` : null,
});

/* ================= ROUTES ================= */

app.get("/", (req, res) => {
    res.json({ message: "Event Management System API" });
});

app.get("/health", (req, res) => {
    res.json({ status: "healthy" });
});

/* ================= EVENTS ================= */

app.get("/api/events", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT e.*, COUNT(r.id) AS registration_count
            FROM events e
            LEFT JOIN registrations r ON e.id = r.event_id
            GROUP BY e.id
            ORDER BY e.date ASC
        `);
        res.json(result.rows.map(formatEvent));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/events/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const event = await pool.query("SELECT * FROM events WHERE id=$1", [id]);
        if (!event.rows.length) return res.status(404).json({ error: "Not found" });

        const regs = await pool.query(
            "SELECT * FROM registrations WHERE event_id=$1",
            [id]
        );

        res.json({
            ...formatEvent(event.rows[0]),
            registrations: regs.rows,
            registration_count: regs.rows.length,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/events", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        const {
            name,
            date,
            time,
            location,
            category,
            description,
            max_attendees = 100,
            ticket_price = 0,
        } = req.body;

        const image_filename = req.file?.filename || null;

        const result = await pool.query(
            `INSERT INTO events
            (name,date,time,location,category,description,image_filename,max_attendees,ticket_price,status,created_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'upcoming',NOW())
            RETURNING *`,
            [name, date, time, location, category, description, image_filename, max_attendees, ticket_price]
        );

        res.status(201).json(formatEvent(result.rows[0]));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/events/:id", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        const { id } = req.params;
        const current = await pool.query("SELECT image_filename FROM events WHERE id=$1", [id]);
        if (!current.rows.length) return res.status(404).json({ error: "Not found" });

        let image_filename = current.rows[0].image_filename;
        if (req.file) image_filename = req.file.filename;

        await pool.query(
            `UPDATE events SET
            name=$1,date=$2,time=$3,location=$4,category=$5,
            description=$6,image_filename=$7,max_attendees=$8,
            ticket_price=$9,updated_at=NOW()
            WHERE id=$10`,
            [
                req.body.name,
                req.body.date,
                req.body.time,
                req.body.location,
                req.body.category,
                req.body.description,
                image_filename,
                req.body.max_attendees,
                req.body.ticket_price,
                id,
            ]
        );

        res.json({ message: "Updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/events/:id", authenticateToken, async (req, res) => {
    try {
        await pool.query("DELETE FROM events WHERE id=$1", [req.params.id]);
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= REGISTRATIONS ================= */

app.post("/api/registrations", async (req, res) => {
    try {
        const { event_id, name, email } = req.body;

        const count = await pool.query(
            "SELECT COUNT(*) FROM registrations WHERE event_id=$1",
            [event_id]
        );

        const max = await pool.query(
            "SELECT max_attendees FROM events WHERE id=$1",
            [event_id]
        );

        if (parseInt(count.rows[0].count) >= max.rows[0].max_attendees)
            return res.status(400).json({ error: "Event full" });

        await pool.query(
            "INSERT INTO registrations (event_id,name,email,registered_at) VALUES ($1,$2,$3,NOW())",
            [event_id, name, email]
        );

        res.status(201).json({ message: "Registered" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* 🔒 ADMIN: GET EVENT REGISTRATIONS */
app.get("/api/events/:id/registrations", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM registrations WHERE event_id=$1 ORDER BY registered_at DESC",
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= ADMIN AUTH ================= */

app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;

    const result = await pool.query(
        "SELECT * FROM admin_users WHERE email=$1 AND password_hash=$2",
        [email, password]
    );

    if (!result.rows.length)
        return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
        { email, role: "admin" },
        process.env.JWT_SECRET || "yalla-event-secret",
        { expiresIn: "24h" }
    );

    res.json({ token });
});

/* ================= DEBUG ================= */

app.get("/debug/db", async (req, res) => {
    const result = await pool.query("SELECT NOW(), version()");
    res.json(result.rows[0]);
});

/* ================= START ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
