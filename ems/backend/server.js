const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
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

// Initialize database tables
async function initDatabase() {
    try {
        console.log("🔧 Checking database tables...");
        
        // Check and create contacts table if missing
        const contactsCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'contacts'
            ) as exists;
        `);
        
        if (!contactsCheck.rows[0].exists) {
            console.log("🛠 Creating missing 'contacts' table...");
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
            console.log("✅ Created 'contacts' table");
            
            // Test insert
            await pool.query(
                "INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3)",
                ['System Admin', 'admin@system.com', 'Contacts table created']
            );
            console.log("✅ Test record inserted into contacts");
        } else {
            console.log("✅ 'contacts' table exists");
        }
        
        // Check other tables
        const tables = ['events', 'registrations', 'admin_users'];
        for (const table of tables) {
            const check = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                ) as exists;
            `, [table]);
            
            if (check.rows[0].exists) {
                console.log(`✅ '${table}' table exists`);
            } else {
                console.log(`⚠️  '${table}' table is missing`);
            }
        }
        
    } catch (err) {
        console.error("❌ Database initialization error:", err.message);
        console.error("Full error:", err);
    }
}

pool.connect()
    .then(async client => {
        console.log("✅ Connected to Supabase");
        await initDatabase();
        client.release();
    })
    .catch(err => console.error("❌ DB connection error:", err));

/* ================= SUPABASE ================= */

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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'upcoming',NOW())
      RETURNING *
    `;
        const values = [name, date, time, location, category, description, image_filename, max_attendees, ticket_price];
        const result = await pool.query(q, values);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* UPDATE EVENT */
app.put("/api/events/:id", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        const { id } = req.params;

        const current = await pool.query("SELECT image_filename FROM events WHERE id=$1", [id]);
        if (!current.rows.length) return res.status(404).json({ error: "Not found" });

        let image_filename = current.rows[0].image_filename;
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
      name=$1,date=$2,time=$3,location=$4,category=$5,
      description=$6,image_filename=$7,max_attendees=$8,
      ticket_price=$9,updated_at=NOW()
      WHERE id=$10
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
        await pool.query(q, values);

        res.json({ message: "Updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* DELETE EVENT */
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
    console.log("📨 CONTACT FORM RECEIVED - Time:", new Date().toISOString());
    console.log("📦 Full Request Body:", JSON.stringify(req.body, null, 2));
    console.log("📦 Content-Type Header:", req.headers['content-type']);
    console.log("📦 Request Method:", req.method);
    console.log("📦 Request URL:", req.url);
    
    try {
        const { name, email, message } = req.body;
        
        console.log("📝 Parsed values:", { name, email, message });
        
        if (!name || !email || !message) {
            console.log("❌ Validation failed - Missing fields");
            return res.status(400).json({ 
                error: "All fields are required",
                received: { name, email, message }
            });
        }

        console.log("💾 Attempting to insert into contacts table...");
        
        // First check if table exists (double-check)
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'contacts'
            ) as table_exists;
        `);
        
        console.log("📊 Contacts table exists?", tableCheck.rows[0].table_exists);
        
        if (!tableCheck.rows[0].table_exists) {
            console.log("🛠 Creating contacts table on the fly...");
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
            console.log("✅ Contacts table created");
        }
        
        const result = await pool.query(
            "INSERT INTO contacts (name, email, message, sent_at) VALUES ($1, $2, $3, NOW()) RETURNING id, name, email, sent_at",
            [name, email, message]
        );
        
        console.log("✅ SUCCESS - Contact inserted with ID:", result.rows[0].id);
        console.log("✅ Inserted data:", result.rows[0]);

        res.status(201).json({ 
            success: true,
            message: "Thank you for your message! We'll get back to you soon.",
            data: result.rows[0]
        });
        
    } catch (err) {
        console.error("❌ DATABASE ERROR in contact submission:");
        console.error("Error message:", err.message);
        console.error("Error code:", err.code || "N/A");
        console.error("Error detail:", err.detail || "N/A");
        console.error("Error hint:", err.hint || "N/A");
        console.error("Full error:", err);
        
        res.status(500).json({ 
            error: "Failed to send message. Please try again.",
            detail: err.message,
            code: err.code
        });
    }
});

app.get("/api/contacts", authenticateToken, async (req, res) => {
    try {
        console.log("📨 Fetching contacts list...");
        const result = await pool.query("SELECT * FROM contacts ORDER BY sent_at DESC");
        console.log(`✅ Found ${result.rows.length} contacts`);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Error fetching contacts:", err);
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

    if (!result.rows.length) return res.status(401).json({ error: "Invalid credentials" });

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

// NEW DEBUG ENDPOINTS FOR CONTACTS
app.get("/api/debug/contacts-table", async (req, res) => {
    try {
        console.log("🔍 Checking contacts table status...");
        
        // Check if table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'contacts'
            ) as table_exists;
        `);
        
        if (!tableCheck.rows[0].table_exists) {
            return res.json({ 
                status: "Table does not exist",
                tableExists: false,
                timestamp: new Date().toISOString()
            });
        }
        
        // Get table structure
        const structure = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'contacts'
            ORDER BY ordinal_position;
        `);
        
        // Get row count
        const count = await pool.query("SELECT COUNT(*) as count FROM contacts");
        
        // Get recent entries
        const recent = await pool.query("SELECT * FROM contacts ORDER BY sent_at DESC LIMIT 10");
        
        res.json({
            tableExists: true,
            tableStructure: structure.rows,
            totalContacts: parseInt(count.rows[0].count),
            recentContacts: recent.rows,
            timestamp: new Date().toISOString()
        });
        
    } catch (err) {
        console.error("Debug error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Direct test endpoint for contacts
app.post("/api/contact/test", async (req, res) => {
    console.log("🧪 TEST CONTACT ENDPOINT HIT");
    console.log("Test request body:", req.body);
    
    try {
        const result = await pool.query(
            "INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING *",
            ['Test User', 'test@example.com', 'This is a test message from API endpoint']
        );
        
        console.log("✅ Test insert successful:", result.rows[0]);
        
        res.json({
            success: true,
            message: "Test contact inserted successfully",
            data: result.rows[0],
            timestamp: new Date().toISOString()
        });
        
    } catch (err) {
        console.error("❌ Test failed:", err);
        res.status(500).json({ 
            error: err.message,
            detail: err.detail,
            hint: err.hint
        });
    }
});

// Diagnostic endpoint to see what's being received
app.post("/api/contact/debug", async (req, res) => {
    console.log("=== DEBUG REQUEST ===");
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("Body type:", typeof req.body);
    console.log("=== END DEBUG ===");
    
    res.json({
        received: true,
        body: req.body,
        headers: req.headers,
        message: "Debug endpoint received your request",
        timestamp: new Date().toISOString()
    });
});

// Check all tables in database
app.get("/api/debug/all-tables", async (req, res) => {
    try {
        const tables = await pool.query(`
            SELECT table_name, table_schema 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        const tableInfo = [];
        for (const table of tables.rows) {
            const count = await pool.query(`SELECT COUNT(*) FROM ${table.table_name}`);
            tableInfo.push({
                name: table.table_name,
                rowCount: parseInt(count.rows[0].count)
            });
        }
        
        res.json({
            tables: tableInfo,
            totalTables: tables.rows.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}`);
    console.log(`📧 Contact endpoint: POST http://localhost:${PORT}/api/contact`);
    console.log(`🔍 Contact debug: GET http://localhost:${PORT}/api/debug/contacts-table`);
    console.log(`🧪 Contact test: POST http://localhost:${PORT}/api/contact/test`);
});