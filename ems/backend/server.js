const express = require("express");
const mysql = require("mysql");
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

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ems"
});

db.connect(err => {
    if (err) {
        console.error("Database connection error:", err);
        return;
    }
    console.log("✅ Database connected successfully");
});

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
        const valid = types.test(file.mimetype) && types.test(path.extname(file.originalname).toLowerCase());
        valid ? cb(null, true) : cb(new Error("Invalid file type"));
    }
});

app.use("/uploads", express.static("uploads"));

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

app.get("/api/events", (req, res) => {
    const q = `
        SELECT e.*, COUNT(r.id) AS registration_count
        FROM events e
        LEFT JOIN registrations r ON e.id = r.event_id
        GROUP BY e.id
        ORDER BY e.date ASC
    `;
    db.query(q, (err, r) => {
        if (err) return res.status(500).json(err);
        res.json(r.map(formatEvent));
    });
});

app.get("/api/events/:id", (req, res) => {
    db.query("SELECT * FROM events WHERE id=?", [req.params.id], (err, r) => {
        if (!r.length) return res.status(404).json({ error: "Not found" });

        db.query("SELECT * FROM registrations WHERE event_id=?", [req.params.id], (_, regs) => {
            res.json({
                ...formatEvent(r[0]),
                registrations: regs,
                registration_count: regs.length
            });
        });
    });
});

app.post("/api/events", authenticateToken, upload.single("image"), (req, res) => {
    const { name, date, time, location, category, description, max_attendees, ticket_price } = req.body;
    const image_filename = req.file ? req.file.filename : null;

    db.query(
        `INSERT INTO events
         (name,date,time,location,category,description,image_filename,max_attendees,ticket_price,status,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,'upcoming',NOW())`,
        [name, date, time, location, category, description, image_filename, max_attendees || 100, ticket_price || 0],
        (err, result) => {
            if (err) return res.status(500).json(err);
            db.query("SELECT * FROM events WHERE id=?", [result.insertId], (_, r) =>
                res.status(201).json(formatEvent(r[0]))
            );
        }
    );
});

app.put("/api/events/:id", authenticateToken, upload.single("image"), (req, res) => {
    const { id } = req.params;
    const { name, date, time, location, category, description, max_attendees, ticket_price } = req.body;

    db.query("SELECT image_filename FROM events WHERE id=?", [id], (_, r) => {
        if (!r.length) return res.status(404).json({ error: "Not found" });

        let image_filename = r[0].image_filename;

        const update = () => {
            db.query(
                `UPDATE events SET name=?,date=?,time=?,location=?,category=?,description=?,image_filename=?,max_attendees=?,ticket_price=?,updated_at=NOW() WHERE id=?`,
                [name, date, time, location, category, description, image_filename, max_attendees, ticket_price, id],
                () => res.json({ message: "Updated" })
            );
        };

        if (req.file) {
            const newName = `event_${id}_${Date.now()}${path.extname(req.file.filename)}`;
            fs.rename(`uploads/${req.file.filename}`, `uploads/${newName}`, () => {
                if (image_filename) fs.unlink(`uploads/${image_filename}`, () => { });
                image_filename = newName;
                update();
            });
        } else update();
    });
});

app.delete("/api/events/:id", authenticateToken, (req, res) => {
    db.query("SELECT image_filename FROM events WHERE id=?", [req.params.id], (_, r) => {
        if (r[0]?.image_filename) fs.unlink(`uploads/${r[0].image_filename}`, () => { });
        db.query("DELETE FROM events WHERE id=?", [req.params.id], () => {
            db.query("DELETE FROM registrations WHERE event_id=?", [req.params.id]);
            res.json({ message: "Deleted" });
        });
    });
});

/* ================= REGISTRATIONS ================= */

app.post("/api/registrations", (req, res) => {
    const { event_id, name, email } = req.body;

    db.query("SELECT max_attendees FROM events WHERE id=?", [event_id], (_, r) => {
        if (!r.length) return res.status(404).json({ error: "Event not found" });

        db.query("SELECT COUNT(*) c FROM registrations WHERE event_id=?", [event_id], (_, c) => {
            if (c[0].c >= r[0].max_attendees)
                return res.status(400).json({ error: "Event full" });

            db.query(
                "INSERT INTO registrations (event_id,name,email,registered_at) VALUES (?,?,?,NOW())",
                [event_id, name, email],
                () => res.status(201).json({ message: "Registered" })
            );
        });
    });
});

/* ================= EVENT REQUESTS (PENDING) ================= */

app.post("/api/events/request", upload.single("image"), (req, res) => {
    const {
        name, date, time, location, category, description,
        max_attendees = 100, ticket_price = 0,
        created_by = "User", user_email = "user@example.com"
    } = req.body;

    if (!name || !date || !location || !category || !description)
        return res.status(400).json({ error: "Missing required fields" });

    db.query(
        `INSERT INTO pending_events
         (name,date,time,location,category,description,image_filename,max_attendees,ticket_price,created_by,user_email,status,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending',NOW())`,
        [
            name, date, time, location, category, description,
            req.file?.filename || null, max_attendees, ticket_price, created_by, user_email
        ],
        (_, result) => res.status(201).json({ success: true, request_id: result.insertId })
    );
});

app.get("/api/admin/pending", authenticateToken, (req, res) => {
    db.query("SELECT * FROM pending_events WHERE status='pending' ORDER BY created_at DESC", (_, r) =>
        res.json(r.map(e => ({
            ...e,
            date: new Date(e.date).toISOString().split("T")[0],
            image_url: e.image_filename ? `/uploads/${e.image_filename}` : null
        })))
    );
});

app.post("/api/admin/pending/:id/approve", authenticateToken, (req, res) => {
    db.query("SELECT * FROM pending_events WHERE id=?", [req.params.id], (_, r) => {
        if (!r.length) return res.status(404).json({ error: "Not found" });
        const p = r[0];

        db.query(
            `INSERT INTO events
             (name,date,time,location,category,description,image_filename,max_attendees,ticket_price,status,created_at)
             VALUES (?,?,?,?,?,?,?,?,?,'upcoming',NOW())`,
            [p.name, p.date, p.time, p.location, p.category, p.description, p.image_filename, p.max_attendees, p.ticket_price],
            (_, ins) => {
                db.query("UPDATE pending_events SET status='approved' WHERE id=?", [req.params.id]);
                res.json({ success: true, event_id: ins.insertId });
            }
        );
    });
});

app.post("/api/admin/pending/:id/reject", authenticateToken, (req, res) => {
    db.query("UPDATE pending_events SET status='rejected' WHERE id=?", [req.params.id], () =>
        res.json({ success: true })
    );
});

app.delete("/api/admin/pending/:id", authenticateToken, (req, res) => {
    db.query("SELECT image_filename FROM pending_events WHERE id=?", [req.params.id], (_, r) => {
        if (r[0]?.image_filename) fs.unlink(`uploads/${r[0].image_filename}`, () => { });
        db.query("DELETE FROM pending_events WHERE id=?", [req.params.id], () =>
            res.json({ success: true })
        );
    });
});

/* ================= ADMIN ================= */

app.post("/api/admin/login", (req, res) => {
    if (req.body.email !== "abdalla@ems.org" || req.body.password !== "adminabdalla")
        return res.status(401).json({ error: "Invalid" });

    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET || "yalla-event-secret", { expiresIn: "24h" });
    res.json({ token });
});

app.get("/api/admin/verify", authenticateToken, (req, res) => {
    res.json({ valid: true });
});

/* ================= ERRORS ================= */

app.use((err, req, res, next) => res.status(400).json({ error: err.message }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
