const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= DATABASE ================= */

const poolConfig = {
    host: process.env.PGHOST || "aws-1-ap-southeast-1.pooler.supabase.com",
    port: parseInt(process.env.PGPORT) || 6543,
    user: process.env.PGUSER || "postgres.bsqznbssksnecndcjzbc",
    password: process.env.PGPASSWORD ? decodeURIComponent(process.env.PGPASSWORD) : "abdalla@3082006@",
    database: process.env.PGDATABASE || "postgres",
    ssl: { rejectUnauthorized: false, require: true },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

const pool = new Pool(poolConfig);

// SIMPLE TABLE CREATION - NO COMPLEX INIT
async function checkAndCreateContactsTable() {
    const client = await pool.connect();
    try {
        console.log("🔄 Checking contacts table...");
        
        // SIMPLE CREATE - No complex checks
        await client.query(`
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                sent_at TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        
        console.log("✅ Contacts table ready");
        
        // DISABLE RLS FOR THIS TABLE
        try {
            await client.query(`ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;`);
            console.log("✅ Disabled RLS for contacts table");
        } catch (rlserr) {
            console.log("ℹ️ RLS already disabled or cannot modify");
        }
        
    } catch (err) {
        console.error("❌ Table check error:", err.message);
    } finally {
        client.release();
    }
}

// Check table on startup
pool.connect()
    .then(async (client) => {
        console.log("✅ Connected to Supabase");
        await checkAndCreateContactsTable();
        client.release();
    })
    .catch(err => console.error("❌ DB connection error:", err));

/* ================= SUPABASE ================= */
const supabaseUrl = process.env.SUPABASE_URL || "https://bsqznbssksnecndcjzbc.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/* ================= MULTER ================= */
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

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
    image_url: event.image_filename || null,
    registration_count: parseInt(event.registration_count || 0),
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
        const regs = await pool.query("SELECT * FROM registrations WHERE event_id=$1", [id]);
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
        const { name, date, time, location, category, description } = req.body;
        const max_attendees = req.body.max_attendees ? parseInt(req.body.max_attendees) : 100;
        const ticket_price = req.body.ticket_price ? parseFloat(req.body.ticket_price) : 0;
        let image_filename = null;
        
        if (req.file) {
            const ext = req.file.originalname.split(".").pop();
            const fileName = `event_${Date.now()}.${ext}`;
            const { error } = await supabase.storage.from("events").upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
            if (error) throw error;
            const { data: publicUrlData } = supabase.storage.from("events").getPublicUrl(fileName);
            image_filename = publicUrlData.publicUrl;
        }

        const q = `
            INSERT INTO events (name, date, time, location, category, description, image_filename, max_attendees, ticket_price, status, created_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'upcoming',NOW()) RETURNING *
        `;
        const values = [name, date, time, location, category, description, image_filename, max_attendees, ticket_price];
        const result = await pool.query(q, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/events/:id", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        const { id } = req.params;
        const current = await pool.query("SELECT image_filename FROM events WHERE id=$1", [id]);
        if (!current.rows.length) return res.status(404).json({ error: "Not found" });
        let image_filename = current.rows[0].image_filename;
        
        if (req.file) {
            const ext = req.file.originalname.split(".").pop();
            const fileName = `event_${Date.now()}.${ext}`;
            const { error } = await supabase.storage.from("events").upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
            if (error) throw error;
            const { data: publicUrlData } = supabase.storage.from("events").getPublicUrl(fileName);
            image_filename = publicUrlData.publicUrl;
        }

        const max_attendees = req.body.max_attendees ? parseInt(req.body.max_attendees) : 100;
        const ticket_price = req.body.ticket_price ? parseFloat(req.body.ticket_price) : 0;

        const q = `
            UPDATE events SET name=$1,date=$2,time=$3,location=$4,category=$5,
            description=$6,image_filename=$7,max_attendees=$8,
            ticket_price=$9,updated_at=NOW() WHERE id=$10
        `;
        const values = [req.body.name, req.body.date, req.body.time, req.body.location, req.body.category, req.body.description, image_filename, max_attendees, ticket_price, id];
        await pool.query(q, values);
        res.json({ message: "Updated" });
    } catch (err) {
        console.error(err);
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
        const count = await pool.query("SELECT COUNT(*) FROM registrations WHERE event_id=$1", [event_id]);
        const max = await pool.query("SELECT max_attendees FROM events WHERE id=$1", [event_id]);
        if (parseInt(count.rows[0].count) >= max.rows[0].max_attendees) return res.status(400).json({ error: "Event full" });
        await pool.query("INSERT INTO registrations (event_id,name,email,registered_at) VALUES ($1,$2,$3,NOW())", [event_id, name, email]);
        res.status(201).json({ message: "Registered" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/events/:id/registrations", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM registrations WHERE event_id=$1 ORDER BY registered_at DESC", [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= PENDING EVENTS ================= */
app.get("/api/admin/pending", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM events WHERE status='pending' ORDER BY date ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= STATS ================= */
app.get("/api/stats", authenticateToken, async (req, res) => {
    try {
        const totalEvents = await pool.query("SELECT COUNT(*) FROM events");
        const upcomingEvents = await pool.query("SELECT COUNT(*) FROM events WHERE date >= CURRENT_DATE");
        const totalRegistrations = await pool.query("SELECT COUNT(*) FROM registrations");
        const revenue = await pool.query(`
            SELECT SUM(e.ticket_price) AS total
            FROM registrations r
            JOIN events e ON r.event_id = e.id
        `);
        res.json({
            totalEvents: parseInt(totalEvents.rows[0].count),
            upcomingEvents: parseInt(upcomingEvents.rows[0].count),
            totalRegistrations: parseInt(totalRegistrations.rows[0].count),
            totalRevenue: parseFloat(revenue.rows[0].total || 0),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= CONTACT ================= */
app.post("/api/contact", async (req, res) => {
    console.log("📨 CONTACT REQUEST RECEIVED:", req.body);
    
    try {
        const { name, email, message } = req.body;
        
        if (!name || !email || !message) {
            console.log("❌ Missing fields");
            return res.status(400).json({ error: "All fields are required" });
        }

        console.log("💾 Inserting contact:", { name, email, message });
        
        // SIMPLE DIRECT INSERT - NO COMPLEX TRANSACTIONS
        const result = await pool.query(
            "INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING id",
            [name, email, message]
        );
        
        console.log("✅ Contact inserted successfully, ID:", result.rows[0].id);
        
        res.status(201).json({ 
            success: true,
            message: "Thank you for your message!",
            id: result.rows[0].id
        });
        
    } catch (err) {
        console.error("❌ CONTACT INSERT ERROR:", err.message);
        console.error("Full error:", err);
        
        // Try emergency fix - create table if error is about missing table
        if (err.message.includes('relation "contacts" does not exist') || err.message.includes('table "contacts" does not exist')) {
            console.log("🛠 Creating contacts table on the fly...");
            try {
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS contacts (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) NOT NULL,
                        message TEXT NOT NULL,
                        sent_at TIMESTAMP DEFAULT NOW(),
                        created_at TIMESTAMP DEFAULT NOW()
                    );
                `);
                
                // Try insert again
                const retryResult = await pool.query(
                    "INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING id",
                    [name, email, message]
                );
                
                console.log("✅ Emergency insert successful, ID:", retryResult.rows[0].id);
                
                return res.status(201).json({ 
                    success: true,
                    message: "Message sent (emergency insert)!",
                    id: retryResult.rows[0].id
                });
            } catch (emergencyErr) {
                console.error("❌ Emergency insert failed:", emergencyErr.message);
            }
        }
        
        res.status(500).json({ 
            error: "Failed to send message",
            detail: err.message
        });
    }
});

app.get("/api/contacts", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM contacts ORDER BY sent_at DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= ADMIN AUTH ================= */
app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM admin_users WHERE email=$1 AND password_hash=$2", [email, password]);
    if (!result.rows.length) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET || "yalla-event-secret", { expiresIn: "24h" });
    res.json({ token });
});

/* ================= DEBUG ================= */
app.get("/debug/db", async (req, res) => {
    const result = await pool.query("SELECT NOW(), version()");
    res.json(result.rows[0]);
});

// NEW: DIRECT SQL FIX ENDPOINT
app.get("/api/fix-contacts", async (req, res) => {
    try {
        console.log("🔧 Running emergency fix for contacts table...");
        
        // Drop and recreate table
        await pool.query('DROP TABLE IF EXISTS contacts CASCADE;');
        
        await pool.query(`
            CREATE TABLE contacts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                sent_at TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        
        // Disable RLS
        await pool.query('ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;');
        
        // Insert test record
        await pool.query(
            "INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3)",
            ['Emergency Fix', 'fix@example.com', 'Table recreated by emergency fix']
        );
        
        res.json({ 
            success: true, 
            message: "Contacts table completely recreated and RLS disabled",
            test_record: "Inserted"
        });
    } catch (err) {
        console.error("Fix error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Check contacts table
app.get("/api/check-contacts", async (req, res) => {
    try {
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'contacts'
            ) as exists;
        `);
        
        if (!tableCheck.rows[0].exists) {
            return res.json({ exists: false, message: "Table doesn't exist" });
        }
        
        const count = await pool.query("SELECT COUNT(*) FROM contacts");
        const sample = await pool.query("SELECT * FROM contacts ORDER BY sent_at DESC LIMIT 5");
        
        res.json({
            exists: true,
            count: parseInt(count.rows[0].count),
            sample: sample.rows,
            message: "Table exists and has data"
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📧 Contact endpoint: POST http://localhost:${PORT}/api/contact`);
    console.log(`🔧 Fix contacts table: GET http://localhost:${PORT}/api/fix-contacts`);
    console.log(`🔍 Check contacts: GET http://localhost:${PORT}/api/check-contacts`);
});