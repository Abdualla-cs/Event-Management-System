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

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false
});

pool.connect()
    .then(() => console.log("✅ PostgreSQL Database connected successfully"))
    .catch(err => console.error("Database connection error:", err));

/* ================= UPLOAD ================= */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "uploads/";
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
        const valid =
            types.test(file.mimetype) &&
            types.test(path.extname(file.originalname).toLowerCase());
        valid ? cb(null, true) : cb(new Error("Invalid file type"));
    }
});

app.use("/uploads", express.static("uploads"));

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

function formatEvent(event) {
    return {
        ...event,
        date: new Date(event.date).toISOString().split("T")[0],
        image_url: event.image_filename ? `/uploads/${event.image_filename}` : null,
        registration_count: parseInt(event.registration_count, 10) || 0
    };
}

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
        const { rows } = await pool.query(q);
        res.json(rows.map(formatEvent));
    } catch (err) {
        res.status(500).json(err);
    }
});

app.get("/api/events/:id", async (req, res) => {
    try {
        const event = await pool.query(
            "SELECT * FROM events WHERE id=$1",
            [req.params.id]
        );

        if (!event.rows.length)
            return res.status(404).json({ error: "Not found" });

        const regs = await pool.query(
            "SELECT * FROM registrations WHERE event_id=$1",
            [req.params.id]
        );

        res.json({
            ...formatEvent(event.rows[0]),
            registrations: regs.rows,
            registration_count: regs.rows.length
        });
    } catch (err) {
        res.status(500).json(err);
    }
});

app.post("/api/events", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        const {
            name, date, time, location,
            category, description,
            max_attendees = 100,
            ticket_price = 0
        } = req.body;

        const { rows } = await pool.query(
            `INSERT INTO events
            (name,date,time,location,category,description,image_filename,max_attendees,ticket_price,status,created_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'upcoming',NOW())
            RETURNING *`,
            [
                name, date, time, location,
                category, description,
                req.file?.filename || null,
                max_attendees, ticket_price
            ]
        );

        res.status(201).json(formatEvent(rows[0]));
    } catch (err) {
        res.status(500).json(err);
    }
});

app.put("/api/events/:id", authenticateToken, upload.single("image"), async (req, res) => {
    const { id } = req.params;
    const {
        name, date, time, location,
        category, description,
        max_attendees, ticket_price
    } = req.body;

    try {
        const r = await pool.query(
            "SELECT image_filename FROM events WHERE id=$1",
            [id]
        );

        if (!r.rows.length)
            return res.status(404).json({ error: "Not found" });

        let image_filename = r.rows[0].image_filename;

        const update = async () => {
            await pool.query(
                `UPDATE events SET
                name=$1,date=$2,time=$3,location=$4,
                category=$5,description=$6,image_filename=$7,
                max_attendees=$8,ticket_price=$9,updated_at=NOW()
                WHERE id=$10`,
                [
                    name, date, time, location,
                    category, description,
                    image_filename,
                    max_attendees, ticket_price, id
                ]
            );
            res.json({ message: "Updated" });
        };

        if (req.file) {
            const newName = `event_${id}_${Date.now()}${path.extname(req.file.filename)}`;
            fs.rename(`uploads/${req.file.filename}`, `uploads/${newName}`, async () => {
                if (image_filename)
                    fs.unlink(`uploads/${image_filename}`, () => { });
                image_filename = newName;
                await update();
            });
        } else {
            await update();
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

app.delete("/api/events/:id", authenticateToken, async (req, res) => {
    try {
        const r = await pool.query(
            "SELECT image_filename FROM events WHERE id=$1",
            [req.params.id]
        );

        if (r.rows[0]?.image_filename)
            fs.unlink(`uploads/${r.rows[0].image_filename}`, () => { });

        await pool.query("DELETE FROM registrations WHERE event_id=$1", [req.params.id]);
        await pool.query("DELETE FROM events WHERE id=$1", [req.params.id]);

        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json(err);
    }
});

/* ================= REGISTRATIONS ================= */

app.post("/api/registrations", async (req, res) => {
    try {
        const { event_id, name, email } = req.body;

        const e = await pool.query(
            "SELECT max_attendees FROM events WHERE id=$1",
            [event_id]
        );
        if (!e.rows.length)
            return res.status(404).json({ error: "Event not found" });

        const c = await pool.query(
            "SELECT COUNT(*) FROM registrations WHERE event_id=$1",
            [event_id]
        );

        if (parseInt(c.rows[0].count) >= e.rows[0].max_attendees)
            return res.status(400).json({ error: "Event full" });

        await pool.query(
            "INSERT INTO registrations (event_id,name,email,registered_at) VALUES ($1,$2,$3,NOW())",
            [event_id, name, email]
        );

        res.status(201).json({ message: "Registered" });
    } catch (err) {
        res.status(500).json(err);
    }
});

/* ================= EVENT REQUESTS (PENDING) ================= */

app.post("/api/events/request", upload.single("image"), async (req, res) => {
    const {
        name, date, time, location, category, description,
        max_attendees = 100, ticket_price = 0,
        created_by = "User", user_email = "user@example.com"
    } = req.body;

    if (!name || !date || !location || !category || !description)
        return res.status(400).json({ error: "Missing required fields" });

    const { rows } = await pool.query(
        `INSERT INTO pending_events
        (name,date,time,location,category,description,image_filename,
         max_attendees,ticket_price,created_by,user_email,status,created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',NOW())
        RETURNING id`,
        [
            name, date, time, location, category, description,
            req.file?.filename || null,
            max_attendees, ticket_price, created_by, user_email
        ]
    );

    res.status(201).json({ success: true, request_id: rows[0].id });
});

app.get("/api/admin/pending", authenticateToken, async (req, res) => {
    const { rows } = await pool.query(
        "SELECT * FROM pending_events WHERE status='pending' ORDER BY created_at DESC"
    );

    res.json(rows.map(e => ({
        ...e,
        date: new Date(e.date).toISOString().split("T")[0],
        image_url: e.image_filename ? `/uploads/${e.image_filename}` : null
    })));
});

app.post("/api/admin/pending/:id/approve", authenticateToken, async (req, res) => {
    const r = await pool.query(
        "SELECT * FROM pending_events WHERE id=$1",
        [req.params.id]
    );

    if (!r.rows.length)
        return res.status(404).json({ error: "Not found" });

    const p = r.rows[0];

    const ins = await pool.query(
        `INSERT INTO events
        (name,date,time,location,category,description,image_filename,max_attendees,ticket_price,status,created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'upcoming',NOW())
        RETURNING id`,
        [
            p.name, p.date, p.time, p.location,
            p.category, p.description,
            p.image_filename, p.max_attendees, p.ticket_price
        ]
    );

    await pool.query(
        "UPDATE pending_events SET status='approved' WHERE id=$1",
        [req.params.id]
    );

    res.json({ success: true, event_id: ins.rows[0].id });
});

app.post("/api/admin/pending/:id/reject", authenticateToken, async (req, res) => {
    await pool.query(
        "UPDATE pending_events SET status='rejected' WHERE id=$1",
        [req.params.id]
    );
    res.json({ success: true });
});

app.delete("/api/admin/pending/:id", authenticateToken, async (req, res) => {
    const r = await pool.query(
        "SELECT image_filename FROM pending_events WHERE id=$1",
        [req.params.id]
    );

    if (r.rows[0]?.image_filename)
        fs.unlink(`uploads/${r.rows[0].image_filename}`, () => { });

    await pool.query(
        "DELETE FROM pending_events WHERE id=$1",
        [req.params.id]
    );

    res.json({ success: true });
});

/* ================= ADMIN ================= */

app.post("/api/admin/login", (req, res) => {
    if (req.body.email !== "abdalla@ems.org" || req.body.password !== "adminabdalla")
        return res.status(401).json({ error: "Invalid" });

    const token = jwt.sign(
        { role: "admin" },
        process.env.JWT_SECRET || "yalla-event-secret",
        { expiresIn: "24h" }
    );

    res.json({ token });
});

app.get("/api/admin/verify", authenticateToken, (req, res) => {
    res.json({ valid: true });
});

/* ================= ERRORS ================= */

app.use((err, req, res, next) =>
    res.status(400).json({ error: err.message })
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
