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
        console.error(err);
        return;
    }
    console.log("DB connected");
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
        valid ? cb(null, true) : cb(new Error("Invalid file"));
    }
});

app.use("/uploads", express.static("uploads"));

const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Denied" });

    jwt.verify(token, process.env.JWT_SECRET || "yalla-event-secret", (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid" });
        req.user = user;
        next();
    });
};

function formatEvent(event) {
    return {
        ...event,
        date: new Date(event.date).toISOString().split("T")[0],
        image_url: event.image_filename ? `/uploads/${event.image_filename}` : null
    };
}

app.get("/api/events", (req, res) => {
    db.query("SELECT * FROM events ORDER BY date ASC", (err, r) => {
        if (err) return res.status(500).json(err);
        res.json(r.map(formatEvent));
    });
});

app.get("/api/events/:id", (req, res) => {
    db.query("SELECT * FROM events WHERE id=?", [req.params.id], (err, r) => {
        if (!r.length) return res.status(404).json({ error: "Not found" });

        db.query("SELECT * FROM registrations WHERE event_id=?", [req.params.id], (_, regs) => {
            const e = { ...r[0], registrations: regs };
            res.json(formatEvent(e));
        });
    });
});

app.post("/api/events", authenticateToken, upload.single("image"), (req, res) => {
    const { name, date, time, location, category, description, max_attendees, ticket_price } = req.body;
    let image_filename = req.file ? req.file.filename : null;

    db.query(
        `INSERT INTO events 
        (name,date,time,location,category,description,image_filename,max_attendees,ticket_price,status,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,'upcoming',NOW())`,
        [name, date, time, location, category, description, image_filename, max_attendees, ticket_price],
        (err, result) => {
            if (err) return res.status(500).json(err);

            const id = result.insertId;

            if (image_filename && image_filename.includes("temp")) {
                const newName = `event_${id}_${Date.now()}${path.extname(image_filename)}`;
                fs.rename(`uploads/${image_filename}`, `uploads/${newName}`, () => {
                    db.query("UPDATE events SET image_filename=? WHERE id=?", [newName, id]);
                });
            }

            db.query("SELECT * FROM events WHERE id=?", [id], (_, r) => {
                res.status(201).json(formatEvent(r[0]));
            });
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
                `UPDATE events SET 
                name=?,date=?,time=?,location=?,category=?,description=?,
                image_filename=?,max_attendees=?,ticket_price=?,updated_at=NOW()
                WHERE id=?`,
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
        } else {
            update();
        }
    });
});

app.delete("/api/events/:id", authenticateToken, (req, res) => {
    db.query("SELECT image_filename FROM events WHERE id=?", [req.params.id], (_, r) => {
        if (r[0]?.image_filename) fs.unlink(`uploads/${r[0].image_filename}`, () => { });
        db.query("DELETE FROM events WHERE id=?", [req.params.id], () => res.json({ message: "Deleted" }));
    });
});

app.post("/api/events/request", upload.single("image"), (req, res) => {
    const {
        name,
        date,
        time,
        location,
        category,
        description,
        max_attendees,
        ticket_price,
        created_by,
        user_email
    } = req.body;

    if (!name || !date || !location || !category || !description) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const image_filename = req.file ? req.file.filename : null;

    db.query(
        `INSERT INTO pending_events 
        (name,date,time,location,category,description,image_filename,
        max_attendees,ticket_price,created_by,user_email,status)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending')`,
        [
            name,
            date,
            time || null,
            location,
            category,
            description,
            image_filename,
            max_attendees || 100,
            ticket_price || 0,
            created_by || "User",
            user_email || "user@example.com"
        ],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                message: "Event request submitted successfully",
                request_id: result.insertId
            });
        }
    );
});

app.get("/api/events/pending", authenticateToken, (req, res) => {
    db.query("SELECT * FROM pending_events WHERE status='pending'", (_, r) => res.json(r));
});

app.post("/api/events/pending/:id/approve", authenticateToken, (req, res) => {
    db.query("SELECT * FROM pending_events WHERE id=?", [req.params.id], (_, r) => {
        const p = r[0];
        db.query(
            `INSERT INTO events 
            (name,date,time,location,category,description,image_filename,
            max_attendees,ticket_price,status,created_at)
            VALUES (?,?,?,?,?,?,?,?,?,'upcoming',NOW())`,
            [p.name, p.date, p.time, p.location, p.category, p.description, p.image_filename, p.max_attendees, p.ticket_price],
            (_, ins) => {
                db.query("UPDATE pending_events SET status='approved' WHERE id=?", [req.params.id]);
                res.json({ event_id: ins.insertId });
            }
        );
    });
});

app.post("/api/events/pending/:id/reject", authenticateToken, (req, res) => {
    db.query("UPDATE pending_events SET status='rejected' WHERE id=?", [req.params.id], () =>
        res.json({ message: "Rejected" })
    );
});

app.delete("/api/events/pending/:id", authenticateToken, (req, res) => {
    db.query("DELETE FROM pending_events WHERE id=?", [req.params.id], () =>
        res.json({ message: "Deleted" })
    );
});

app.post("/api/registrations", (req, res) => {
    const { event_id, name, email } = req.body;

    if (!event_id || !name || !email) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    db.query("SELECT max_attendees FROM events WHERE id=?", [event_id], (err, r) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!r.length) return res.status(404).json({ error: "Event not found" });

        const maxAttendees = parseInt(r[0].max_attendees, 10);

        db.query("SELECT COUNT(*) AS c FROM registrations WHERE event_id=?", [event_id], (err2, c) => {
            if (err2) return res.status(500).json({ error: err2.message });

            const currentCount = parseInt(c[0].c, 10);
            console.log(`Event ${event_id}: ${currentCount} / ${maxAttendees}`);

            if (currentCount >= maxAttendees) {
                return res.status(400).json({ error: "Event full" });
            }

            db.query(
                "INSERT INTO registrations (event_id,name,email,registered_at) VALUES (?,?,?,NOW())",
                [event_id, name, email],
                err3 => {
                    if (err3) return res.status(500).json({ error: err3.message });
                    res.status(201).json({ message: "Registered" });
                }
            );
        });
    });
});

app.post("/api/contact", (req, res) => {
    const { name, email, message } = req.body;
    db.query(
        "INSERT INTO contacts (name,email,message,sent_at) VALUES (?,?,?,NOW())",
        [name, email, message],
        () => res.status(201).json({ message: "Sent" })
    );
});

app.post("/api/admin/login", (req, res) => {
    if (req.body.email !== "abdalla@ems.org" || req.body.password !== "adminabdalla") {
        return res.status(401).json({ error: "Invalid" });
    }

    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET || "yalla-event-secret", {
        expiresIn: "24h"
    });

    res.json({ token });
});

app.get("/api/stats", authenticateToken, (req, res) => {
    const stats = {};
    db.query("SELECT COUNT(*) c FROM events", (_, r1) => {
        stats.events = r1[0].c;
        db.query("SELECT COUNT(*) c FROM registrations", (_, r2) => {
            stats.registrations = r2[0].c;
            res.json(stats);
        });
    });
});

app.use((err, req, res, next) => {
    res.status(400).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
