const express = require("express");
const mysql = require("mysql2/promise"); // Changed from pg
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

// MySQL Connection Pool Configuration
const poolConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ems",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
};

// Create MySQL connection pool
let pool;

try {
    pool = mysql.createPool(poolConfig);
    console.log("✅ MySQL connection pool created");
} catch (err) {
    console.error("❌ MySQL pool creation error:", err);
    process.exit(1);
}

// Test connection
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Connected to MySQL database");
        connection.release();
    } catch (err) {
        console.error("❌ MySQL connection error:", err);
    }
})();

/* ================= SUPABASE (For Images Only) ================= */

const supabaseUrl = process.env.SUPABASE_URL || "https://bsqznbssksnecndcjzbc.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/* ================= MULTER ================= */

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
});

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
    date: event.date ? new Date(event.date).toISOString().split("T")[0] : null,
    image_url: event.image_filename || null,
    registration_count: parseInt(event.registration_count || 0),
});

// Helper function for MySQL queries
async function executeQuery(sql, params = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error("MySQL Query Error:", error);
        throw error;
    }
}

/* ================= ROUTES ================= */

app.get("/", (req, res) => {
    res.json({ message: "Event Management System API (MySQL)" });
});

app.get("/health", async (req, res) => {
    try {
        await pool.getConnection();
        res.json({ status: "healthy", database: "connected" });
    } catch (err) {
        res.status(500).json({ status: "unhealthy", database: "disconnected" });
    }
});

/* ================= EVENTS ================= */

app.get("/api/events", async (req, res) => {
    try {
        const rows = await executeQuery(`
            SELECT e.*, COUNT(r.id) AS registration_count
            FROM events e
            LEFT JOIN registrations r ON e.id = r.event_id
            GROUP BY e.id
            ORDER BY e.date ASC
        `);
        res.json(rows.map(formatEvent));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/events/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const eventRows = await executeQuery("SELECT * FROM events WHERE id = ?", [id]);
        if (!eventRows.length) return res.status(404).json({ error: "Not found" });

        const regRows = await executeQuery("SELECT * FROM registrations WHERE event_id = ?", [id]);

        res.json({
            ...formatEvent(eventRows[0]),
            registrations: regRows,
            registration_count: regRows.length,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* POST EVENT */
app.post("/api/events", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        const { name, date, time, location, category, description } = req.body;
        const max_attendees = req.body.max_attendees ? parseInt(req.body.max_attendees) : 100;
        const ticket_price = req.body.ticket_price ? parseFloat(req.body.ticket_price) : 0;

        let image_filename = null;
        if (req.file) {
            const ext = req.file.originalname.split(".").pop();
            const fileName = `event_${Date.now()}.${ext}`;
            const { error } = await supabase
                .storage.from("events")
                .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
            if (error) throw error;

            const { data: publicUrlData } = supabase.storage.from("events").getPublicUrl(fileName);
            image_filename = publicUrlData.publicUrl;
        }

        const q = `
            INSERT INTO events 
            (name, date, time, location, category, description, image_filename, max_attendees, ticket_price, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', NOW())
        `;

        const values = [name, date, time, location, category, description, image_filename, max_attendees, ticket_price];
        const result = await executeQuery(q, values);

        // Get the inserted event
        const [insertedRows] = await pool.query("SELECT * FROM events WHERE id = LAST_INSERT_ID()");

        res.status(201).json(insertedRows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* UPDATE EVENT */
app.put("/api/events/:id", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        const { id } = req.params;

        const currentRows = await executeQuery("SELECT image_filename FROM events WHERE id = ?", [id]);
        if (!currentRows.length) return res.status(404).json({ error: "Not found" });

        let image_filename = currentRows[0].image_filename;
        if (req.file) {
            const ext = req.file.originalname.split(".").pop();
            const fileName = `event_${Date.now()}.${ext}`;
            const { error } = await supabase
                .storage.from("events")
                .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
            if (error) throw error;

            const { data: publicUrlData } = supabase.storage.from("events").getPublicUrl(fileName);
            image_filename = publicUrlData.publicUrl;
        }

        const max_attendees = req.body.max_attendees ? parseInt(req.body.max_attendees) : 100;
        const ticket_price = req.body.ticket_price ? parseFloat(req.body.ticket_price) : 0;

        const q = `
            UPDATE events SET
            name = ?, date = ?, time = ?, location = ?, category = ?,
            description = ?, image_filename = ?, max_attendees = ?,
            ticket_price = ?, updated_at = NOW()
            WHERE id = ?
        `;

        const values = [
            req.body.name,
            req.body.date,
            req.body.time,
            req.body.location,
            req.body.category,
            req.body.description,
            image_filename,
            max_attendees,
            ticket_price,
            id,
        ];

        await executeQuery(q, values);
        res.json({ message: "Updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* DELETE EVENT */
app.delete("/api/events/:id", authenticateToken, async (req, res) => {
    try {
        await executeQuery("DELETE FROM events WHERE id = ?", [req.params.id]);
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= REGISTRATIONS ================= */

app.post("/api/registrations", async (req, res) => {
    try {
        const { event_id, name, email } = req.body;

        const countRows = await executeQuery("SELECT COUNT(*) as count FROM registrations WHERE event_id = ?", [event_id]);
        const maxRows = await executeQuery("SELECT max_attendees FROM events WHERE id = ?", [event_id]);

        if (parseInt(countRows[0].count) >= maxRows[0].max_attendees) {
            return res.status(400).json({ error: "Event full" });
        }

        await executeQuery(
            "INSERT INTO registrations (event_id, name, email, registered_at) VALUES (?, ?, ?, NOW())",
            [event_id, name, email]
        );

        res.status(201).json({ message: "Registered" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/events/:id/registrations", authenticateToken, async (req, res) => {
    try {
        const rows = await executeQuery(
            "SELECT * FROM registrations WHERE event_id = ? ORDER BY registered_at DESC",
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= PENDING EVENTS ================= */

app.get("/api/admin/pending", authenticateToken, async (req, res) => {
    try {
        const rows = await executeQuery("SELECT * FROM events WHERE status = 'pending' ORDER BY date ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= STATS ================= */

app.get("/api/stats", authenticateToken, async (req, res) => {
    try {
        const totalEventsRows = await executeQuery("SELECT COUNT(*) as count FROM events");
        const upcomingEventsRows = await executeQuery("SELECT COUNT(*) as count FROM events WHERE date >= CURDATE()");
        const totalRegistrationsRows = await executeQuery("SELECT COUNT(*) as count FROM registrations");
        const revenueRows = await executeQuery(`
            SELECT SUM(e.ticket_price) AS total
            FROM registrations r
            JOIN events e ON r.event_id = e.id
        `);

        res.json({
            totalEvents: parseInt(totalEventsRows[0].count),
            upcomingEvents: parseInt(upcomingEventsRows[0].count),
            totalRegistrations: parseInt(totalRegistrationsRows[0].count),
            totalRevenue: parseFloat(revenueRows[0].total || 0),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= CONTACT ================= */

app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) return res.status(400).json({ error: "All fields are required" });

        await executeQuery(
            "INSERT INTO contacts (name, email, message, sent_at) VALUES (?, ?, ?, NOW())",
            [name, email, message]
        );

        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/contacts", authenticateToken, async (req, res) => {
    try {
        const rows = await executeQuery("SELECT * FROM contacts ORDER BY sent_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= ADMIN AUTH ================= */

app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;

    const rows = await executeQuery(
        "SELECT * FROM admin_users WHERE email = ? AND password_hash = ?",
        [email, password]
    );

    if (!rows.length) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
        { email, role: "admin" },
        process.env.JWT_SECRET || "yalla-event-secret",
        { expiresIn: "24h" }
    );

    res.json({ token });
});

/* ================= DEBUG ================= */

app.get("/debug/db", async (req, res) => {
    try {
        const rows = await executeQuery("SELECT NOW() as now, VERSION() as version");
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT} (MySQL)`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    if (pool) {
        await pool.end();
        console.log('MySQL pool closed');
    }
    process.exit(0);
});