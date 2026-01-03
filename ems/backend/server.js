const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= DATABASE ================= */

const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: decodeURIComponent(process.env.PGPASSWORD),
    database: process.env.PGDATABASE,
    ssl: { rejectUnauthorized: false }
});

pool.connect()
    .then(c => {
        console.log("✅ Connected to PostgreSQL");
        c.release();
    })
    .catch(err => console.error("❌ DB error:", err));

/* ================= SUPABASE ================= */

const supabase = createClient(
    "https://bsqznbssksnecndcjzbc.supabase.co",
    process.env.SUPABASE_KEY
);

/* ================= FILE UPLOAD ================= */

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

/* ================= AUTH ================= */

const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
};

/* ================= HELPERS ================= */

const formatEvent = e => ({
    ...e,
    date: new Date(e.date).toISOString().split("T")[0],
    registration_count: parseInt(e.registration_count || 0)
});

/* ================= BASIC ================= */

app.get("/", (_, res) => {
    res.json({ message: "Event Management API" });
});

app.get("/health", (_, res) => {
    res.json({ status: "ok" });
});

/* ================= EVENTS ================= */

app.get("/api/events", async (_, res) => {
    try {
        const r = await pool.query(`
            SELECT e.*, COUNT(rg.id) AS registration_count
            FROM events e
            LEFT JOIN registrations rg ON e.id = rg.event_id
            GROUP BY e.id
            ORDER BY e.date ASC
        `);
        res.json(r.rows.map(formatEvent));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/events/:id", async (req, res) => {
    try {
        const e = await pool.query(
            "SELECT * FROM events WHERE id=$1",
            [req.params.id]
        );
        if (!e.rows.length)
            return res.status(404).json({ error: "Not found" });

        const r = await pool.query(
            "SELECT * FROM registrations WHERE event_id=$1",
            [req.params.id]
        );

        res.json({
            ...formatEvent(e.rows[0]),
            registrations: r.rows,
            registration_count: r.rows.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ===== CREATE EVENT (Supabase Image Upload) ===== */

app.post(
    "/api/events",
    authenticateToken,
    upload.single("image"),
    async (req, res) => {
        try {
            const {
                name, date, time, location,
                category, description,
                max_attendees = 100,
                ticket_price = 0
            } = req.body;

            let image_filename = null;

            if (req.file) {
                const ext = req.file.originalname.split(".").pop();
                const fileName = `${Date.now()}.${ext}`;

                const { error } = await supabase
                    .storage
                    .from("events")
                    .upload(fileName, req.file.buffer, {
                        contentType: req.file.mimetype
                    });

                if (error) throw error;

                const { data } = supabase
                    .storage
                    .from("events")
                    .getPublicUrl(fileName);

                image_filename = data.publicUrl;
            }

            const q = `
                INSERT INTO events
                (name,date,time,location,category,description,
                 image_filename,max_attendees,ticket_price,status,created_at)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'upcoming',NOW())
                RETURNING *
            `;

            const v = [
                name, date, time, location,
                category, description,
                image_filename, max_attendees, ticket_price
            ];

            const r = await pool.query(q, v);
            res.status(201).json(r.rows[0]);

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
);

/* ================= REGISTRATIONS ================= */

app.post("/api/registrations", async (req, res) => {
    try {
        const { event_id, name, email } = req.body;

        const c = await pool.query(
            "SELECT COUNT(*) FROM registrations WHERE event_id=$1",
            [event_id]
        );

        const m = await pool.query(
            "SELECT max_attendees FROM events WHERE id=$1",
            [event_id]
        );

        if (+c.rows[0].count >= m.rows[0].max_attendees)
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

/* ================= ADMIN ================= */

app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;

    const r = await pool.query(
        "SELECT * FROM admin_users WHERE email=$1 AND password_hash=$2",
        [email, password]
    );

    if (!r.rows.length)
        return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
        { email, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
    );

    res.json({ token });
});

/* ================= DEBUG ================= */

app.get("/debug/db", async (_, res) => {
    const r = await pool.query("SELECT NOW(), version()");
    res.json(r.rows[0]);
});

/* ================= START ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
);
