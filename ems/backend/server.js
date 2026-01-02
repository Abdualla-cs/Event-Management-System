const express = require("express");
const { Pool } = require("pg"); // PostgreSQL client
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

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Supabase
    }
});

// Test database connection
pool.connect()
    .then(client => {
        console.log("✅ PostgreSQL Database connected successfully");
        client.release();
    })
    .catch(err => {
        console.error("Database connection error:", err);
    });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "/tmp/uploads/"; // Use /tmp on Render (no persistent storage)
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

        if (eventResult.rows.length === 0) {
            return res.status(404).json({ error: "Not found" });
        }

        const regsResult = await pool.query("SELECT * FROM registrations WHERE event_id=$1", [eventId]);

        res.json({
            ...formatEvent(eventResult.rows[0]),
            registrations: regsResult.rows,
            registration_count: regsResult.rows.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/events", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        const { name, date, time, location, category, description, max_attendees, ticket_price } = req.body;
        const image_filename = req.file ? req.file.filename : null;

        const q = `
      INSERT INTO events 
      (name, date, time, location, category, description, image_filename, max_attendees, ticket_price, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'upcoming', NOW())
      RETURNING *
    `;

        const values = [
            name, date, time, location, category, description,
            image_filename, max_attendees || 100, ticket_price || 0
        ];

        const result = await pool.query(q, values);
        res.status(201).json(formatEvent(result.rows[0]));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/events/:id", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, date, time, location, category, description, max_attendees, ticket_price } = req.body;

        // Get current image
        const currentResult = await pool.query("SELECT image_filename FROM events WHERE id=$1", [id]);
        if (currentResult.rows.length === 0) {
            return res.status(404).json({ error: "Not found" });
        }

        let image_filename = currentResult.rows[0].image_filename;

        // Handle new file upload
        if (req.file) {
            const newName = `event_${id}_${Date.now()}${path.extname(req.file.filename)}`;

            // Rename the uploaded file
            fs.rename(`/tmp/uploads/${req.file.filename}`, `/tmp/uploads/${newName}`, async (err) => {
                if (err) console.error("Error renaming file:", err);

                // Delete old file if exists
                if (image_filename) {
                    fs.unlink(`/tmp/uploads/${image_filename}`, (err) => {
                        if (err) console.error("Error deleting old image:", err);
                    });
                }

                image_filename = newName;

                // Update database
                await updateDatabase();
            });
        } else {
            await updateDatabase();
        }

        async function updateDatabase() {
            const q = `
        UPDATE events SET 
        name=$1, date=$2, time=$3, location=$4, category=$5, 
        description=$6, image_filename=$7, max_attendees=$8, 
        ticket_price=$9, updated_at=NOW() 
        WHERE id=$10
      `;

            await pool.query(q, [
                name, date, time, location, category,
                description, image_filename, max_attendees,
                ticket_price, id
            ]);

            res.json({ message: "Updated" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/events/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get image filename
        const result = await pool.query("SELECT image_filename FROM events WHERE id=$1", [id]);

        // Delete image file if exists
        if (result.rows[0]?.image_filename) {
            fs.unlink(`/tmp/uploads/${result.rows[0].image_filename}`, (err) => {
                if (err) console.error("Error deleting image:", err);
            });
        }

        // Delete event (registrations will be deleted via CASCADE)
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

        // Check event exists and get max attendees
        const eventResult = await pool.query("SELECT max_attendees FROM events WHERE id=$1", [event_id]);
        if (eventResult.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Count current registrations
        const countResult = await pool.query("SELECT COUNT(*) as c FROM registrations WHERE event_id=$1", [event_id]);
        const currentCount = parseInt(countResult.rows[0].c, 10);

        if (currentCount >= eventResult.rows[0].max_attendees) {
            return res.status(400).json({ error: "Event full" });
        }

        // Insert registration
        await pool.query(
            "INSERT INTO registrations (event_id, name, email, registered_at) VALUES ($1, $2, $3, NOW())",
            [event_id, name, email]
        );

        res.status(201).json({ message: "Registered" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= EVENT REQUESTS (PENDING) ================= */

app.post("/api/events/request", upload.single("image"), async (req, res) => {
    try {
        const {
            name, date, time, location, category, description,
            max_attendees = 100, ticket_price = 0,
            created_by = "User", user_email = "user@example.com"
        } = req.body;

        if (!name || !date || !location || !category || !description) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const q = `
      INSERT INTO pending_events 
      (name, date, time, location, category, description, image_filename, 
       max_attendees, ticket_price, created_by, user_email, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', NOW())
      RETURNING id
    `;

        const values = [
            name, date, time, location, category, description,
            req.file?.filename || null, max_attendees, ticket_price,
            created_by, user_email
        ];

        const result = await pool.query(q, values);
        res.status(201).json({ success: true, request_id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/admin/pending", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM pending_events WHERE status='pending' ORDER BY created_at DESC"
        );

        const pendingEvents = result.rows.map(e => ({
            ...e,
            date: new Date(e.date).toISOString().split("T")[0],
            image_url: e.image_filename ? `/uploads/${e.image_filename}` : null
        }));

        res.json(pendingEvents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/admin/pending/:id/approve", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get pending event
        const pendingResult = await pool.query("SELECT * FROM pending_events WHERE id=$1", [id]);
        if (pendingResult.rows.length === 0) {
            return res.status(404).json({ error: "Not found" });
        }

        const p = pendingResult.rows[0];

        // Insert into events
        const q = `
      INSERT INTO events 
      (name, date, time, location, category, description, image_filename, 
       max_attendees, ticket_price, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'upcoming', NOW())
      RETURNING id
    `;

        const values = [
            p.name, p.date, p.time, p.location, p.category,
            p.description, p.image_filename, p.max_attendees, p.ticket_price
        ];

        const result = await pool.query(q, values);

        // Update pending status
        await pool.query("UPDATE pending_events SET status='approved' WHERE id=$1", [id]);

        res.json({ success: true, event_id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/admin/pending/:id/reject", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("UPDATE pending_events SET status='rejected' WHERE id=$1", [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/admin/pending/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get image filename
        const result = await pool.query("SELECT image_filename FROM pending_events WHERE id=$1", [id]);

        // Delete image file if exists
        if (result.rows[0]?.image_filename) {
            fs.unlink(`/tmp/uploads/${result.rows[0].image_filename}`, (err) => {
                if (err) console.error("Error deleting image:", err);
            });
        }

        // Delete pending event
        await pool.query("DELETE FROM pending_events WHERE id=$1", [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= ADMIN ================= */

app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check admin credentials
        const result = await pool.query(
            "SELECT * FROM admin_users WHERE email=$1 AND password_hash=$2",
            [email, password]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { email: result.rows[0].email, role: "admin" },
            process.env.JWT_SECRET || "yalla-event-secret",
            { expiresIn: "24h" }
        );

        res.json({ token, user: { email: result.rows[0].email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/admin/verify", authenticateToken, (req, res) => {
    res.json({ valid: true });
});

/* ================= ERRORS ================= */

app.use((err, req, res, next) => {
    res.status(400).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));