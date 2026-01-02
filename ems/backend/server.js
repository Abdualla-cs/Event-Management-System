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

// Supabase Transaction Pooler configuration
const poolConfig = {
    host: process.env.PGHOST || 'aws-1-ap-southeast-1.pooler.supabase.com',
    port: parseInt(process.env.PGPORT) || 6543,
    user: process.env.PGUSER || 'postgres.bsqznbssksnecndcjzbc',
    password: process.env.PGPASSWORD ? decodeURIComponent(process.env.PGPASSWORD) : 'abdalla@3082006@',
    database: process.env.PGDATABASE || 'postgres',
    ssl: {
        rejectUnauthorized: false,
        require: true
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
};

console.log('Database connection details:', {
    host: poolConfig.host,
    port: poolConfig.port,
    user: poolConfig.user,
    database: poolConfig.database,
    ssl: poolConfig.ssl ? 'enabled' : 'disabled'
});

const pool = new Pool(poolConfig);

// Test connection on startup
pool.connect()
    .then(client => {
        console.log('✅ Successfully connected to Supabase via Transaction Pooler');
        client.release();
        return pool.query('SELECT NOW() as time');
    })
    .then(result => {
        console.log('✅ Database time check:', result.rows[0].time);
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
        console.error('Full error:', err);
    });

/* ================= FILE UPLOAD ================= */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "/tmp/uploads/";
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const eventId = req.params.id || "temp";
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `event_${eventId}_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const types = /jpeg|jpg|png|gif|webp/;
        const valid = types.test(file.mimetype) && types.test(path.extname(file.originalname).toLowerCase());
        valid ? cb(null, true) : cb(new Error("Invalid file type"));
    }
});

app.use("/uploads", express.static("/tmp/uploads"));

/* ================= AUTHENTICATION ================= */

const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied" });

    jwt.verify(token, process.env.JWT_SECRET || "yalla-event-secret", (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
};

/* ================= HELPER FUNCTIONS ================= */

function formatEvent(event) {
    return {
        ...event,
        date: new Date(event.date).toISOString().split("T")[0],
        image_url: event.image_filename ? `/uploads/${event.image_filename}` : null,
        registration_count: parseInt(event.registration_count, 10) || 0
    };
}

/* ================= ROUTES ================= */

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date() });
});

// Root route
app.get("/", (req, res) => {
    res.json({
        message: "Event Management System API",
        endpoints: {
            events: "/api/events",
            admin_login: "/api/admin/login",
            health: "/health"
        }
    });
});

/* ================= EVENTS ================= */

app.get("/api/events", async (req, res) => {
    try {
        const q = `
            SELECT e.*, COUNT(r.id) AS registration_count
            FROM events e
            LEFT JOIN registrations r ON e.id = r.event_id
            GROUP BY e.id
            ORDER BY e.date ASC
        `;
        const result = await pool.query(q);
        res.json(result.rows.map(formatEvent));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/events/:id", async (req, res) => {
    try {
        const eventId = req.params.id;
        const eventResult = await pool.query("SELECT * FROM events WHERE id=$1", [eventId]);

        if (!eventResult.rows.length)
            return res.status(404).json({ error: "Not found" });

        const regs = await pool.query("SELECT * FROM registrations WHERE event_id=$1", [eventId]);

        res.json({
            ...formatEvent(eventResult.rows[0]),
            registrations: regs.rows,
            registration_count: regs.rows.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/events", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        const { name, date, time, location, category, description, max_attendees = 100, ticket_price = 0 } = req.body;
        const image_filename = req.file ? req.file.filename : null;

        const q = `
            INSERT INTO events
            (name, date, time, location, category, description, image_filename,
             max_attendees, ticket_price, status, created_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'upcoming',NOW())
            RETURNING *
        `;

        const result = await pool.query(q, [
            name, date, time, location, category,
            description, image_filename, max_attendees, ticket_price
        ]);

        res.status(201).json(formatEvent(result.rows[0]));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/events/:id", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, date, time, location, category, description, max_attendees, ticket_price } = req.body;

        const current = await pool.query("SELECT image_filename FROM events WHERE id=$1", [id]);
        if (!current.rows.length) return res.status(404).json({ error: "Not found" });

        let image_filename = current.rows[0].image_filename;
        if (req.file) {
            const newName = `event_${id}_${Date.now()}${path.extname(req.file.filename)}`;
            fs.renameSync(`/tmp/uploads/${req.file.filename}`, `/tmp/uploads/${newName}`);
            if (image_filename) fs.unlink(`/tmp/uploads/${image_filename}`, () => { });
            image_filename = newName;
        }

        await pool.query(
            `UPDATE events SET
             name=$1,date=$2,time=$3,location=$4,category=$5,
             description=$6,image_filename=$7,
             max_attendees=$8,ticket_price=$9,updated_at=NOW()
             WHERE id=$10`,
            [name, date, time, location, category, description, image_filename, max_attendees, ticket_price, id]
        );

        res.json({ message: "Updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/events/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT image_filename FROM events WHERE id=$1", [id]);

        if (result.rows[0]?.image_filename) fs.unlink(`/tmp/uploads/${result.rows[0].image_filename}`, () => { });
        await pool.query("DELETE FROM events WHERE id=$1", [id]);

        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= REGISTRATIONS ================= */

app.post("/api/registrations", async (req, res) => {
    try {
        const { event_id, name, email } = req.body;

        const event = await pool.query("SELECT max_attendees FROM events WHERE id=$1", [event_id]);
        if (!event.rows.length) return res.status(404).json({ error: "Event not found" });

        const count = await pool.query("SELECT COUNT(*) FROM registrations WHERE event_id=$1", [event_id]);
        if (parseInt(count.rows[0].count, 10) >= event.rows[0].max_attendees)
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

/* ================= PENDING EVENTS ================= */

app.post("/api/events/request", upload.single("image"), async (req, res) => {
    try {
        const { name, date, time, location, category, description, max_attendees = 100, ticket_price = 0, created_by = "User", user_email = "user@example.com" } = req.body;

        if (!name || !date || !location || !category || !description)
            return res.status(400).json({ error: "Missing required fields" });

        const result = await pool.query(
            `INSERT INTO pending_events
             (name,date,time,location,category,description,image_filename,
              max_attendees,ticket_price,created_by,user_email,status,created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',NOW())
             RETURNING id`,
            [name, date, time, location, category, description, req.file?.filename || null, max_attendees, ticket_price, created_by, user_email]
        );

        res.status(201).json({ success: true, request_id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= ADMIN ================= */

app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query("SELECT * FROM admin_users WHERE email=$1 AND password_hash=$2", [email, password]);
        if (!result.rows.length) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET || "yalla-event-secret", { expiresIn: "24h" });

        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/admin/verify", authenticateToken, (req, res) => {
    res.json({ valid: true });
});

/* ================= ERROR HANDLER ================= */

app.use((err, req, res, next) => {
    res.status(400).json({ error: err.message });
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
