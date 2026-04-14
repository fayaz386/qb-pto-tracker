const express = require("express");
const path = require("path");
const https = require("https");
const fs = require("fs");
const multer = require("multer");
const { parse } = require("csv-parse");
const { Pool } = require("pg");
const crypto = require("crypto");
const os = require("os");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// === Multer Configuration for Notes ===
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "public/uploads/notes");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, "note-" + uniqueSuffix + ext);
  }
});
const uploadNotes = multer({ storage: storage });


// === Employee Notes Routes ===

// GET notes
app.get("/api/employee-notes", authMiddleware, async (req, res) => {
  const { hotel, employee } = req.query;
  if (!hotel || !employee) return res.status(400).json({ error: "Missing hotel or employee" });

  try {
    const r = await pool.query(
      `SELECT * FROM employee_notes WHERE hotel = $1 AND employee_key = $2 ORDER BY created_at DESC`,
      [hotel, employee]
    );
    res.json({ ok: true, rows: r.rows });
  } catch (e) {
    console.error("Get Notes Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// POST (Create) note
app.post("/api/employee-notes", authMiddleware, uploadNotes.single('file'), async (req, res) => {
  const { hotel, employee_key, note } = req.body;
  const file = req.file;

  if (!hotel || !employee_key || !note) return res.status(400).json({ error: "Missing fields" });

  try {
    const creator = (req.user && req.user.username) ? req.user.username : "System";
    const attachmentPath = file ? `/uploads/notes/${file.filename}` : null;

    const r = await pool.query(
      `INSERT INTO employee_notes (hotel, employee_key, note, created_by, attachment_path) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [hotel, employee_key, note, creator, attachmentPath]
    );
    res.json({ ok: true, row: r.rows[0] });
  } catch (e) {
    console.error("Create Note Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// PUT (Edit) note
app.put("/api/employee-notes/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  if (!note) return res.status(400).json({ error: "Note content required" });

  try {
    // Optional: Check permissions? Admin can edit all. User can edit own?
    // For now, allow edit if authenticated.
    const r = await pool.query(
      `UPDATE employee_notes SET note = $1 WHERE id = $2 RETURNING *`,
      [note, id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: "Note not found" });
    res.json({ ok: true, row: r.rows[0] });
  } catch (e) {
    console.error("Update Note Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE note
app.delete("/api/employee-notes/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM employee_notes WHERE id = $1`, [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error("Delete Note Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Update Employee Profile
app.put("/api/employees/:employee_key", authMiddleware, async (req, res) => {
  const empKey = req.params.employee_key;
  const { work_status, inactive_reason, inactive_note, last_day } = req.body;
  try {
    const r = await pool.query(
      `UPDATE employees SET 
        work_status = COALESCE($1, work_status), 
        inactive_reason = COALESCE($2, inactive_reason), 
        inactive_note = COALESCE($3, inactive_note), 
        last_day = COALESCE($4, last_day)
      WHERE employee_key = $5 RETURNING *`,
      [work_status, inactive_reason, inactive_note, last_day, empKey]
    );
    res.json({ ok: true, row: r.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = Number(process.env.PORT || 8085);

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || "pto_tracker",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "",
});

/* =========================
   v1.1 Settings + Manual Entries (safe, non-destructive)
========================= */
const DEFAULT_HOTELS = [
  "Holiday Inn & Suites -2565 Argentia",
  "Holiday Inn Express & Suites - 5599 Ambler",
];


async function ensureSchema() {
  /* v1.3.14 schema updates */
   await pool.query(`
     ALTER TABLE pto_balances ADD COLUMN IF NOT EXISTS sick_amount NUMERIC;
     ALTER TABLE pto_balances ADD COLUMN IF NOT EXISTS bereavement_hours NUMERIC;
     ALTER TABLE pto_balances ADD COLUMN IF NOT EXISTS bereavement_amount NUMERIC;
     ALTER TABLE pto_balances ADD COLUMN IF NOT EXISTS vacation_amount NUMERIC;
     ALTER TABLE imports ADD COLUMN IF NOT EXISTS sick_amount_col TEXT;
     ALTER TABLE imports ADD COLUMN IF NOT EXISTS year INTEGER;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS opening_vac_amount NUMERIC DEFAULT 0;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS opening_vac_hours NUMERIC DEFAULT 0;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS opening_sick_amount NUMERIC DEFAULT 0;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS opening_sick_hours NUMERIC DEFAULT 0;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS vacation_hours_available NUMERIC DEFAULT 0;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS sick_hours_available NUMERIC DEFAULT 0;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS vacation_days_allowed NUMERIC DEFAULT 0;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS vacation_accrual_period TEXT;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS vacation_hours_accrued NUMERIC DEFAULT 0;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS vacation_max_hours NUMERIC DEFAULT 0;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS vacation_reset_yearly BOOLEAN DEFAULT false;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS vacation_hours_used NUMERIC DEFAULT 0;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS sick_accrual_period TEXT;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS sick_hours_accrued NUMERIC DEFAULT 0;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS sick_max_hours NUMERIC DEFAULT 0;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS sick_reset_yearly BOOLEAN DEFAULT false;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS sick_hours_used NUMERIC DEFAULT 0;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_status TEXT;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS inactive_reason TEXT;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS inactive_note TEXT;
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_day TEXT;
   `);
}

async function ensureSettingsTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings_hotels (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings_years (
      id SERIAL PRIMARY KEY,
      year INTEGER UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings_types (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      max_allowed NUMERIC,
      min_allowed NUMERIC,
      hotel TEXT
    );
    
    CREATE TABLE IF NOT EXISTS settings_vacation_options (
      id SERIAL PRIMARY KEY,
      label TEXT UNIQUE NOT NULL,
      max_allowed NUMERIC NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employee_vacation_option (
      hotel TEXT NOT NULL,
      employee TEXT NOT NULL,
      vacation_option_id INTEGER NOT NULL REFERENCES settings_vacation_options(id) ON DELETE RESTRICT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (hotel, employee)
    );
    CREATE TABLE IF NOT EXISTS manual_entries (
      id SERIAL PRIMARY KEY,
      hotel TEXT NOT NULL,
      employee TEXT NOT NULL,
      year INTEGER NOT NULL,
      type TEXT NOT NULL,
      hours NUMERIC,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      from_date DATE,
      to_date DATE,
      days NUMERIC,
      allocated_year INTEGER
    );

    CREATE TABLE IF NOT EXISTS settings_ip_allowlist (
      id SERIAL PRIMARY KEY,
      ip_address TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS employee_notes (
      id SERIAL PRIMARY KEY,
      hotel TEXT NOT NULL,
      employee_key TEXT NOT NULL,
      note TEXT NOT NULL,
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS payroll_dates (
      id SERIAL PRIMARY KEY,
      hotel TEXT NOT NULL,
      year INTEGER NOT NULL,
      payroll_no TEXT,
      pay_date DATE,
      period_start DATE,
      period_end DATE,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS deduction_payments (
      id SERIAL PRIMARY KEY,
      hotel TEXT NOT NULL,
      payroll_date_id INTEGER REFERENCES payroll_dates(id) ON DELETE CASCADE,
      ei_employee NUMERIC,
      ei_company NUMERIC,
      cpp_employee NUMERIC,
      cpp_company NUMERIC,
      fed_tax NUMERIC,
      employees_paid INTEGER,
      gross_pay NUMERIC,
      net_pay NUMERIC,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  try { await pool.query(`ALTER TABLE settings_types ADD COLUMN IF NOT EXISTS max_allowed NUMERIC`); } catch (e) { }
  try { await pool.query(`ALTER TABLE settings_types ADD COLUMN IF NOT EXISTS min_allowed NUMERIC`); } catch (e) { }
  try { await pool.query(`ALTER TABLE settings_types ADD COLUMN IF NOT EXISTS hotel TEXT`); } catch (e) { }
  try { await pool.query(`ALTER TABLE manual_entries ADD COLUMN IF NOT EXISTS days NUMERIC`); } catch (e) { } // Ensure days exists
  try { await pool.query(`ALTER TABLE manual_entries ADD COLUMN IF NOT EXISTS from_date DATE`); } catch (e) { }
  try { await pool.query(`ALTER TABLE manual_entries ADD COLUMN IF NOT EXISTS to_date DATE`); } catch (e) { }
  try { await pool.query(`ALTER TABLE manual_entries ADD COLUMN IF NOT EXISTS allocated_year INTEGER`); } catch (e) { } // New column


  // MIGRATION: Update existing global settings (hotel=NULL) to the first default hotel
  // so they don't disappear or cause unique constraint issues if we enforce (hotel, name).
  if (DEFAULT_HOTELS.length > 0) {
    await pool.query(`UPDATE settings_types SET hotel = $1 WHERE hotel IS NULL`, [DEFAULT_HOTELS[0]]);
  }

  // CONSTRAINT: Unique (hotel, name)
  try {
    await pool.query(`ALTER TABLE settings_types DROP CONSTRAINT IF EXISTS settings_types_name_key`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS settings_types_hotel_name_key ON settings_types (hotel, name)`);
  } catch (e) { console.warn("Constraint update warning:", e.message); }

  const hc = await pool.query(`SELECT COUNT(*)::int AS c FROM settings_hotels`);
  if (hc.rows[0].c === 0) {
    for (const h of DEFAULT_HOTELS) {
      await pool.query(
        `INSERT INTO settings_hotels (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [h]
      );
    }
  }

  const yc = await pool.query(`SELECT COUNT(*)::int AS c FROM settings_years`);
  if (yc.rows[0].c === 0) {
    const y = new Date().getFullYear();
    await pool.query(
      `INSERT INTO settings_years (year) VALUES ($1) ON CONFLICT (year) DO NOTHING`,
      [y]
    );
  }

  // Seed Types FOR EACH HOTEL
  for (const h of DEFAULT_HOTELS) {
    for (const t of ["Vacation", "Sick", "Bereavement"]) {
      // Basic defaults, Max 0 if not set? Or leave null.
      await pool.query(
        `INSERT INTO settings_types (hotel, name) VALUES ($1, $2) ON CONFLICT (hotel, name) DO NOTHING`,
        [h, t]
      );
    }
  }

  // Seed vacation options if empty
  const vc = await pool.query(`SELECT COUNT(*)::int AS c FROM settings_vacation_options`);
  if (vc.rows[0].c === 0) {
    const seeds = [
      { label: "10 days", max_allowed: 10 },
      { label: "15 days", max_allowed: 15 },
      { label: "20 days", max_allowed: 20 },
    ];
    for (const s of seeds) {
      await pool.query(
        `INSERT INTO settings_vacation_options (label, max_allowed) VALUES ($1, $2)
       ON CONFLICT (label) DO NOTHING`,
        [s.label, s.max_allowed]
      );
    }
  }
}

ensureSettingsTables().catch((err) => {
  console.error("[Settings] init failed:", err.message);
});

/* =========================
   v1.4 Auth & Users
========================= */
const AUTH_SALT_LEN = 16;

function hashPassword(password) {
  const salt = crypto.randomBytes(AUTH_SALT_LEN).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const verifyHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return hash === verifyHash;
}

async function ensureAuthTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
      first_name TEXT,
      last_name TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sync_history (
      id SERIAL PRIMARY KEY,
      username TEXT,
      details TEXT,
      status TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    
    ALTER TABLE sync_history ADD COLUMN IF NOT EXISTS hotel TEXT; 
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
    
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Seed Admin if no users
  const uc = await pool.query(`SELECT COUNT(*)::int AS c FROM users`);
  if (uc.rows[0].c === 0) {
    const { hash, salt } = hashPassword("Admin123!");
    await pool.query(
      `INSERT INTO users (username, password_hash, salt, role, first_name, last_name)
       VALUES ($1, $2, $3, 'admin', 'System', 'Admin')`,
      ["admin", hash, salt]
    );
    console.log("[Auth] Default admin created: admin / Admin123!");
  }
}

ensureAuthTables().catch(err => {
  console.error("[Auth] init failed:", err.message);
});

/* =========================
   Auth Middleware & Routes
========================= */

// Middleware: Populate req.user if session valid
async function authMiddleware(req, res, next) {
  const cookie = req.headers.cookie;
  if (!cookie) return next();

  const match = cookie.match(/auth_token=([a-zA-Z0-9]+)/);
  if (!match) return next();

  const token = match[1];
  try {
    const r = await pool.query(
      `SELECT u.id, u.username, u.role, u.first_name, u.last_name, s.expires_at 
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.expires_at > now()`,
      [token]
    );
    if (r.rows.length > 0) {
      req.user = r.rows[0];
    }
  } catch (e) {
    console.error("Auth check failed", e);
  }
  next();
}

// Middleware: Require Login
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// Middleware: Require Admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  next();
}

// Middleware: IP Filter
async function ipFilterMiddleware(req, res, next) {
  // 1. Always allow Localhost AND Local Network Interfaces (Self)
  let ip = req.ip || req.connection.remoteAddress;
  if (!ip) {
    console.warn("DEBUG: req.ip is undefined, falling back to 127.0.0.1");
    ip = "127.0.0.1";
  }
  if (ip.startsWith("::ffff:")) ip = ip.substring(7); // Normalize IPv4-mapped IPv6

  // Detect local interfaces dynamically (Cache this in real app)
  const interfaces = os.networkInterfaces();
  const localIPs = ["127.0.0.1", "::1", "localhost"];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' || iface.family === 4) {
        localIPs.push(iface.address);
      }
    }
  }

  // Ensure private network / VPN IPs are allowed by default
  const isPrivate = (ipStr) => {
    if (ipStr === "127.0.0.1" || ipStr === "::1" || ipStr === "localhost") return true;
    const parts = ipStr.split('.');
    if (parts.length !== 4) return false;
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    if (p1 === 10) return true;
    if (p1 === 172 && (p2 >= 16 && p2 <= 31)) return true;
    if (p1 === 192 && p2 === 168) return true;
    return false;
  };

  if (localIPs.includes(ip) || isPrivate(ip)) {
    // console.log(`DEBUG: IP ${ip} allowed (Local/Self/Private)`);
    return next();
  }

  try {
    // 2. Check DB allowlist
    const r = await pool.query('SELECT 1 FROM settings_ip_allowlist WHERE ip_address = $1', [ip]);

    // 3. Logic: Default Deny if not found
    if (r.rows.length > 0) {
      // console.log(`DEBUG: IP ${ip} allowed (Allowlist)`);
      return next(); // IP is allowed
    }

    // 4. Deny
    console.warn(`[Blocked] IP ${ip} tried to access ${req.path}. Not in localIPs: ${JSON.stringify(localIPs)}`);
    res.status(403).send("<h1>403 Forbidden</h1><p>Your IP address is not authorized to access this system.</p>");
  } catch (e) {
    console.error("IP Filter Error:", e);
    next(); // Fail open to avoid lockout on DB error.
  }
}

app.use(ipFilterMiddleware);
app.use(authMiddleware);

// Middleware: Maintenance Mode Check
app.use(async (req, res, next) => {
  // Bypasses (Login, Health, Public Assets handled by static)
  if (req.path.startsWith("/api/auth") || !req.path.startsWith("/api")) return next();

  try {
    const r = await pool.query("SELECT value FROM system_settings WHERE key = 'maintenance_mode'");
    const isMaint = r.rows.length > 0 && r.rows[0].value === 'true';

    if (isMaint) {
      // Only allow 'admin' username
      if (!req.user || req.user.username !== 'admin') {
        return res.status(503).json({ error: "Maintenance Mode Active", maintenance: true });
      }
    }
  } catch (e) { console.error("Maint check failed", e); }
  next();
});

// Global API Guard: Block all /api requests if not logged in (except auth/health)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') &&
    !req.path.startsWith('/api/auth') &&
    !req.path.startsWith('/api/health')) {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
  }
  next();
});

// --- Auth Endpoints ---

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const r = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
    if (r.rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = r.rows[0];
    if (!verifyPassword(password, user.password_hash, user.salt)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.is_blocked) {
      return res.status(403).json({ error: "Your account has been temporarily blocked. Please contact the administrator." });
    }

    // Check Maintenance Mode
    const maintCheck = await pool.query("SELECT value FROM system_settings WHERE key = 'maintenance_mode'");
    const isMaint = maintCheck.rows.length > 0 && maintCheck.rows[0].value === 'true';

    if (isMaint && user.username !== 'admin') {
      return res.status(503).json({ error: "System is currently in Maintenance Mode. Access is restricted to the administrator." });
    }

    // Create Session
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    let ip = req.ip || req.connection.remoteAddress;
    if (ip && ip.startsWith("::ffff:")) ip = ip.substring(7);
    const ua = req.headers["user-agent"] || "Unknown";

    await pool.query(
      `INSERT INTO sessions (token, user_id, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)`,
      [token, user.id, expiresAt, ip, ua]
    );

    // Set Cookie (HTTP Only)
    res.set("Set-Cookie", `auth_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`);
    res.json({ ok: true, role: user.role });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  const cookie = req.headers.cookie;
  if (cookie) {
    const match = cookie.match(/auth_token=([a-zA-Z0-9]+)/);
    if (match) {
      await pool.query(`DELETE FROM sessions WHERE token = $1`, [match[1]]);
    }
  }
  res.set("Set-Cookie", `auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`);
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not logged in" });
  res.json({
    ok: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      first_name: req.user.first_name,
      last_name: req.user.last_name
    }
  });
});

// --- User Management (Admin Only) ---

app.get("/api/users", requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(`SELECT id, username, role, first_name, last_name, is_blocked, created_at FROM users ORDER BY id ASC`);
    res.json({ ok: true, users: r.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/users", requireAdmin, async (req, res) => {
  const { username, password, role, first_name, last_name } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });

  try {
    const { hash, salt } = hashPassword(password);
    await pool.query(
      `INSERT INTO users (username, password_hash, salt, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6)`,
      [username, hash, salt, role || 'user', first_name, last_name]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message }); // Likely unique constraint
  }
});

app.delete("/api/users/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query(`DELETE FROM users WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/users/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { password, role, first_name, last_name, is_blocked } = req.body;

  try {
    if (password) {
      const { hash, salt } = hashPassword(password);
      await pool.query(`UPDATE users SET password_hash=$1, salt=$2 WHERE id=$3`, [hash, salt, id]);
    }
    if (role) await pool.query(`UPDATE users SET role=$1 WHERE id=$2`, [role, id]);
    if (first_name) await pool.query(`UPDATE users SET first_name=$1 WHERE id=$2`, [first_name, id]);
    if (last_name) await pool.query(`UPDATE users SET last_name=$1 WHERE id=$2`, [last_name, id]);
    if (is_blocked !== undefined) await pool.query(`UPDATE users SET is_blocked=$1 WHERE id=$2`, [is_blocked, id]);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Maintenance API
app.get("/api/settings/maintenance", async (req, res) => {
  try {
    const r = await pool.query("SELECT value FROM system_settings WHERE key='maintenance_mode'");
    res.json({ ok: true, enabled: (r.rows.length > 0 && r.rows[0].value === 'true') });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post("/api/settings/maintenance", requireAdmin, async (req, res) => {
  try {
    const { enabled } = req.body; // true/false
    await pool.query("INSERT INTO system_settings (key, value) VALUES ('maintenance_mode', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [String(enabled)]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/sync-history", async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM sync_history ORDER BY created_at DESC LIMIT 50`);
    res.json({ ok: true, rows: r.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const HOTELS = [
  "Holiday Inn & Suites -2565 Argentia",
  "Holiday Inn Express & Suites - 5599 Ambler",
];

function toNumberOrNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const cleaned = s.replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

ensureSchema().catch(console.error);


function normalizeEmployeeKey(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim().replace(/^"|"$/g, "").trim();
}

async function upsertEmployee(client, employeeKey) {
  const q = `
    INSERT INTO employees (employee_key, display_name)
    VALUES ($1, $2)
    ON CONFLICT (employee_key)
    DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING id
  `;
  const r = await client.query(q, [employeeKey, employeeKey]);
  return r.rows[0].id;
}

function autoDetectColumns(headers) {
  const raw = headers.map((h) => String(h || "").trim());
  const norm = raw.map((h) => h.toLowerCase());

  let vacIdx = norm.findIndex((h) => h.includes("vacation") && !h.includes("amount") && !h.includes("$"));
  if (vacIdx === -1) vacIdx = norm.findIndex((h) => h.includes("vacpay") && h.includes("accru"));

  let sickIdx = norm.findIndex((h) => h.includes("sick") && !h.includes("amount") && !h.includes("$"));

  // Try to find Sick Amount
  let sickAmtIdx = norm.findIndex((h) => h.includes("sick") && (h.includes("amount") || h.includes("$")));

  return {
    vacationCol: vacIdx >= 0 ? raw[vacIdx] : "",
    sickCol: sickIdx >= 0 ? raw[sickIdx] : "",
    sickAmountCol: sickAmtIdx >= 0 ? raw[sickAmtIdx] : "",
  };
}

function safeFilePart(s) {
  return String(s || "")
    .replace(/[^\w.\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function storeCsvToDisk(importId, reportKind, originalName, csvText) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const base = `${importId}_${reportKind}_${stamp}_${safeFilePart(originalName || "quickbooks")}.csv`;
  const fullPath = path.join(UPLOAD_DIR, base);
  fs.writeFileSync(fullPath, csvText, "utf8");
  return base;
}

function isValidHotel(h) {
  return HOTELS.includes(h);
}

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/hotels", (req, res) => {
  res.json({ ok: true, hotels: HOTELS });
});

/** Imports list (latest first) */
app.get("/api/imports", async (req, res) => {
  try {
    const r = await pool.query(
      `
      SELECT
        id,
        created_at,
        report_kind,
        imported_by,
        hotel,
        source_filename,
        stored_filename,
        rows_total,
        rows_ok,
        rows_skipped,
        sick_amount_col,
        year
      FROM imports
      ORDER BY year DESC NULLS LAST, created_at DESC
      LIMIT 200
      `
    );
    res.json({ ok: true, rows: r.rows.map((x) => ({ ...x, status: "OK" })) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Manual Entries API (List for Notifications)
app.get("/api/manual-entries", async (req, res) => {
  try {
    const hotel = String(req.query.hotel || "").trim();
    if (!hotel) return res.status(400).json({ error: "Hotel required" });

    const r = await pool.query(
      `SELECT * FROM manual_entries WHERE hotel = $1 ORDER BY created_at DESC`,
      [hotel]
    );
    res.json({ ok: true, rows: r.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Employees list filtered by hotel (based on balances linked to imports) */
app.get("/api/employees", async (req, res) => {
  try {
    const hotel = String(req.query.hotel || "").trim();
    if (!hotel || !isValidHotel(hotel)) {
      return res.status(400).json({ ok: false, error: "Valid hotel is required." });
    }

    // RBAC: Hide "Management Salaries" from 'user' role
    const isUser = req.user && req.user.role === 'user';
    const filterClause = isUser ? "AND (e.job_title IS NULL OR e.job_title NOT ILIKE '%Management Salaries%')" : "";

    const currentYear = new Date().getFullYear();
    const r = await pool.query(
      `
      SELECT e.employee_key AS name, e.is_active,
             CASE WHEN upper(e.employee_key) = 'TOTAL' THEN 1 ELSE 0 END AS tot_sort
      FROM employees e
      WHERE
         (
           EXISTS (SELECT 1 FROM pto_balances b JOIN imports i ON i.id = b.import_id WHERE b.employee_id = e.id AND i.hotel = $1)
           OR EXISTS (SELECT 1 FROM employee_vacation_option o WHERE o.employee = e.employee_key AND o.hotel = $1)
           OR EXISTS (SELECT 1 FROM manual_entries m WHERE m.employee = e.employee_key AND m.hotel = $1)
         )
         ${filterClause}
      ORDER BY tot_sort, name
      `,
      [hotel]
    );

    const employees = r.rows.map((row) => ({
      name: row.name,
      isActive: (row.is_active !== false)
    }));

    res.json({ ok: true, employees });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * Employee Details (latest + recent history) by hotel + employee
 * - latest: most recent import row for this employee within the selected hotel
 * - history: up to 20 recent imports for this employee within hotel
 */
app.get("/api/employee-details", async (req, res) => {
  try {
    const hotel = String(req.query.hotel || "").trim();
    const employee = String(req.query.employee || "").trim();

    if (!hotel || !isValidHotel(hotel)) {
      return res.status(400).json({ ok: false, error: "Valid hotel is required." });
    }
    if (!employee) {
      return res.status(400).json({ ok: false, error: "Employee is required." });
    }

    // RBAC Check: Block "Management Salaries" for 'user' role
    if (req.user && req.user.role === 'user') {
      const checkTitle = await pool.query(
        `SELECT job_title FROM employees WHERE employee_key = $1`,
        [employee]
      );
      if (checkTitle.rows.length > 0) {
        const title = checkTitle.rows[0].job_title || "";
        if (title.toLowerCase().includes("management salaries")) {
          return res.status(403).json({ ok: false, error: "Access Denied: Restricted Employee Record." });
        }
      }
    }

    const latestReportsQ = `
  SELECT DISTINCT ON (i.report_kind)
    e.employee_key AS employee,
    i.hotel,
    i.created_at AS import_date,
    i.report_kind AS report_type,
    NULLIF((row_to_json(b)::jsonb->>'vacation_hours'),'')::numeric AS vacation_hours,
    NULLIF((row_to_json(b)::jsonb->>'sick_hours'),'')::numeric AS sick_hours,
    NULLIF((row_to_json(b)::jsonb->>'sick_amount'),'')::numeric AS sick_amount,
    COALESCE((row_to_json(i)::jsonb->>'file_name'), (row_to_json(i)::jsonb->>'filename'), (row_to_json(i)::jsonb->>'original_filename'), (row_to_json(i)::jsonb->>'source_file')) AS source_file,
    i.imported_by
  FROM pto_balances b
  JOIN employees e ON e.id = b.employee_id
  JOIN imports i ON i.id = b.import_id
  WHERE i.hotel = $1 AND e.employee_key = $2
  ORDER BY i.report_kind, i.created_at DESC
`;

    const historyQ = `
      SELECT
        i.created_at AS import_date,
        i.year,
        i.report_kind,
        i.imported_by,
        i.source_filename,
        NULLIF((row_to_json(b)::jsonb->>'vacation_hours'),'')::numeric AS vacation_hours,
        NULLIF((row_to_json(b)::jsonb->>'vacation_amount'),'')::numeric AS vacation_amount,
        NULLIF((row_to_json(b)::jsonb->>'sick_hours'),'')::numeric AS sick_hours,
        NULLIF((row_to_json(b)::jsonb->>'sick_amount'),'')::numeric AS sick_amount,
        NULLIF((row_to_json(b)::jsonb->>'bereavement_hours'),'')::numeric AS bereavement_hours,
        NULLIF((row_to_json(b)::jsonb->>'bereavement_amount'),'')::numeric AS bereavement_amount,
        'Import' as source,
        NULL as note,
        NULL as days,
        NULL as type,
        NULL as date_range,
        i.id as id,
        NULL as allocated_year,
        NULL as from_date,
        NULL as to_date
      FROM employees e
      JOIN pto_balances b ON b.employee_id = e.id
      JOIN imports i ON i.id = b.import_id
      WHERE i.hotel = $1 AND e.employee_key = $2
      
      UNION ALL
      
      SELECT
        m.created_at AS import_date,
        m.year,
        'manual' AS report_kind,
        'Admin' AS imported_by,
        'Manual Entry' AS source_filename,
        CASE WHEN m.type = 'Vacation' AND m.hours IS NOT NULL THEN m.hours ELSE NULL END AS vacation_hours,
        NULL AS vacation_amount,
        CASE WHEN m.type = 'Sick' AND m.hours IS NOT NULL THEN m.hours ELSE NULL END AS sick_hours,
        NULL AS sick_amount,
        CASE WHEN m.type = 'Bereavement' AND m.hours IS NOT NULL THEN m.hours ELSE NULL END AS bereavement_hours,
        NULL AS bereavement_amount,
        'Manual' as source,
        m.note,
        m.days,
        m.type,
        CONCAT(m.from_date, ' to ', m.to_date) as date_range,
        m.id,
        m.allocated_year,
        m.from_date,
        m.to_date
      FROM manual_entries m
      WHERE m.hotel = $1 AND m.employee = $2
      
      ORDER BY year DESC NULLS LAST, import_date DESC
    `;

    // Fetch actual employee record by joining to imports/balances for verification
    // Fetch actual employee record directly (no join required if we trust the key)
    const empRes = await pool.query(
      `SELECT * FROM employees WHERE employee_key = $1`,
      [employee]
    );
    const emp = empRes.rows[0] || {};

    const latestReportsR = await pool.query(latestReportsQ, [hotel, employee]);
    const historyR = await pool.query(historyQ, [hotel, employee]);

    // 1. Determine "Current Year" (max year in history, or current calendar year if none)
    const allRows = historyR.rows || [];
    const currentYear = allRows.reduce((max, r) => (r.year && r.year > max ? r.year : max), new Date().getFullYear());

    // 2. Aggregate Balances
    // Vacation Amount: "Combined total of history" (Sum All)
    // Vacation Hours: "Current Year Only" or SYNCED FROM QB
    // Sick: "Current Year Only" or SYNCED FROM QB

    // PREFER SYNCED VALUES IF AVAILABLE
    // NOTE: 'vacation_hours_available' from DB is populated by QB Report Sync, which returns DOLLARS ("Vacation Pay Available").
    // So we map it to vacAmtTotal, not vacHrsTotal.
    let vacAmtTotal = Number(emp.vacation_hours_available || 0);

    // If opening balance exists, ALWAYS add it (User Logic)
    vacAmtTotal += Number(emp.opening_vac_amount || 0);

    let vacHrsTotal = 0; // Hours not synced from Amount-based report
    let sickHrsTotal = Number(emp.sick_hours_available || 0);
    let sickAmtTotal = Number(emp.opening_sick_amount || 0);
    let berHrsTotal = 0;
    let berAmtTotal = 0;

    for (const r of allRows) {
      // Vacation Amount: All History (Accumulated)
      if (r.vacation_amount) vacAmtTotal += Number(r.vacation_amount);

      // Current Year Calculations (Hours only)
      // LOGIC CHANGE: If manual entry has 'allocated_year', use that. Otherwise use 'year'.
      const effectiveYear = r.allocated_year ? Number(r.allocated_year) : r.year;

      if (effectiveYear === currentYear) {
        if (r.vacation_hours) vacHrsTotal += Number(r.vacation_hours);
        if (r.sick_hours) sickHrsTotal += Number(r.sick_hours);
        if (r.bereavement_hours) berHrsTotal += Number(r.bereavement_hours);

        // Manual Entries with 'days' need to be converted to hours logic for display?
        // Actually, manual entries have 'hours' stored if standard, OR we rely on 'days'.
        // The dashboard sums 'sick_hours'. 
        // If the manual entry was entered as 'Sick' with '2 days', we store 'days=2'.
        // Does it store 'hours'? 'hours' might be null in manual entry if only days provided.
        // We should fix this in aggregation or ensure hours are stored.
        // Current logic in manual entries POST: stores both if provided.
        // But usually frontend sends hours or we calc.
        // FOR NOW: Stick to existing fields.
        if (r.sick_amount) sickAmtTotal += Number(r.sick_amount);
        if (r.bereavement_amount) berAmtTotal += Number(r.bereavement_amount);
      }
    }

    // Filter out old 'payroll' type if we want to hide it
    const visibleReports = allRows.filter(r => r.report_kind !== "payroll");

    res.json({
      ok: true,
      employee: {
        id: emp.id,
        name: emp.employee_key,
        hotel: emp.hotel,
        opening_vac_amount: Number(emp.opening_vac_amount || 0),
        // Profile Data
        account_number: emp.account_number,
        email: emp.email,
        phone: emp.phone,
        hired_date: emp.hired_date,
        birth_date: emp.birth_date,
        job_title: emp.job_title,
        address: emp.address
      },
      hotel,
      latest_reports: latestReportsR.rows || [],
      current_balance: {
        vacation_hours: vacHrsTotal,
        vacation_amount: vacAmtTotal,
        sick_hours: sickHrsTotal,
        sick_amount: sickAmtTotal,
        bereavement_hours: berHrsTotal,
        bereavement_amount: berAmtTotal,
        vacation_used: emp.vacation_used_amount != null ? Number(emp.vacation_used_amount) : null,
        sick_used: emp.sick_used_amount != null ? Number(emp.sick_used_amount) : null,
        sick_used_hours: emp.sick_used_hours != null ? Number(emp.sick_used_hours) : null,
        sick_days_used: emp.sick_days_used != null ? Number(emp.sick_days_used) : null,
        bereavement_used_hours: emp.bereavement_used_hours != null ? Number(emp.bereavement_used_hours) : null,
        bereavement_used_amount: emp.bereavement_used_amount != null ? Number(emp.bereavement_used_amount) : null,
        bereavement_days_used: emp.bereavement_days_used != null ? Number(emp.bereavement_days_used) : null,
        
        // --- NEW ACCRUAL FIELDS ---
        vacation_accrual_period: emp.vacation_accrual_period,
        vacation_hours_accrued: emp.vacation_hours_accrued != null ? Number(emp.vacation_hours_accrued) : null,
        vacation_max_hours: emp.vacation_max_hours != null ? Number(emp.vacation_max_hours) : null,
        vacation_reset_yearly: emp.vacation_reset_yearly,
        
        sick_hours_available: emp.sick_hours_available != null ? Number(emp.sick_hours_available) : null,
        sick_accrual_period: emp.sick_accrual_period,
        sick_hours_accrued: emp.sick_hours_accrued != null ? Number(emp.sick_hours_accrued) : null,
        sick_max_hours: emp.sick_max_hours != null ? Number(emp.sick_max_hours) : null,
        sick_reset_yearly: emp.sick_reset_yearly,
        sick_hours_used_accrual: emp.sick_hours_used != null ? Number(emp.sick_hours_used) : null
      },
      history: visibleReports.slice(0, 50), // Limit returned history to 50
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/** Open/download stored CSV */
app.get("/api/imports/:id/file", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).send("Invalid id");

  try {
    const r = await pool.query(
      `SELECT stored_filename, source_filename FROM imports WHERE id = $1`,
      [id]
    );
    if (r.rowCount === 0) return res.status(404).send("Not found");

    const stored = r.rows[0].stored_filename;
    const original = r.rows[0].source_filename || `import_${id}.csv`;

    if (!stored) return res.status(404).send("No stored file for this import yet.");

    const fullPath = path.join(UPLOAD_DIR, stored);
    if (!fs.existsSync(fullPath)) return res.status(404).send("Stored file missing on disk.");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename = "${safeFilePart(original) || "import.csv"}"`);
    fs.createReadStream(fullPath).pipe(res);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// [Removed duplicate /api/settings/opening-balances]

// UPDATE Opening Balance
app.post("/api/employees/:id/opening-balance", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const fields = [];
    const vals = [];
    let idx = 1;

    // We accept vacDaysAllowed
    const { vacAmount, vacHours, sickAmount, sickHours, vacDaysAllowed } = req.body;

    if (vacAmount !== undefined) { fields.push(`opening_vac_amount=$${idx++}`); vals.push(vacAmount === "" ? null : Number(vacAmount)); }
    if (vacHours !== undefined) { fields.push(`opening_vac_hours=$${idx++}`); vals.push(vacHours === "" ? null : Number(vacHours)); }
    if (sickAmount !== undefined) { fields.push(`opening_sick_amount=$${idx++}`); vals.push(sickAmount === "" ? null : Number(sickAmount)); }
    if (sickHours !== undefined) { fields.push(`opening_sick_hours=$${idx++}`); vals.push(sickHours === "" ? null : Number(sickHours)); }
    if (vacDaysAllowed !== undefined) { fields.push(`vacation_days_allowed=$${idx++}`); vals.push(vacDaysAllowed === "" ? null : Number(vacDaysAllowed)); }

    if (fields.length === 0) return res.json({ ok: true }); // nothing to update

    vals.push(id);
    await pool.query(`UPDATE employees SET ${fields.join(", ")} WHERE id=$${idx}`, vals);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/** Delete import (DB + stored file) */
app.delete("/api/imports/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Invalid id" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const r = await client.query(`SELECT stored_filename FROM imports WHERE id = $1`, [id]);
    if (r.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ ok: false, error: "Import not found" });
    }

    const stored = r.rows[0].stored_filename;

    await client.query(`DELETE FROM imports WHERE id = $1`, [id]);

    await client.query("COMMIT");

    if (stored) {
      const fullPath = path.join(UPLOAD_DIR, stored);
      try {
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch (_) { }
    }

    res.json({ ok: true });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch (_) { }
    res.status(500).json({ ok: false, error: e.message });
  } finally {
    client.release();
  }
});

// [Removed duplicate /opening-balance route]



async function importPayrollReport({ client, csvText, filename, importedBy, hotel, year }) {
  const rows = [];
  await new Promise((resolve, reject) => {
    parse(
      csvText,
      { bom: true, relax_column_count: true, skip_empty_lines: true, trim: true, columns: false },
      (err, output) => {
        if (err) return reject(err);
        output.forEach((r) => rows.push(r));
        resolve();
      }
    );
  });

  // Detect Format

  const row1 = rows[0].map(s => String(s || "").trim().toLowerCase());
  const row2 = (rows.length > 1) ? rows[1].map(s => String(s || "").trim().toLowerCase()) : [];

  const sickRateColIdx = row1.findIndex(h => h.includes("sick hourly rate"));

  // Dynamic Block Detection (Sample 3 family):
  // Check for "Qty" in Row 2 OR just reliable headers in Row 1.
  // We look for specific headers in Row 1 to enable feature blocks.
  const hasBer = row1.some(h => h.includes("bereavement"));
  const hasSick = row1.some(h => h.includes("sick"));
  const hasVac = row1.some(h => h.includes("vacation"));

  // Check for Qty in row 2 (tolerant)
  const hasQty = rows.length > 1 && row2.some(s => s.includes("qty"));

  // It is "Sample 3 Dynamic" if we have Qty in row 2 AND at least one of these headers.
  const isSample3Dynamic = hasQty && (hasBer || hasSick || hasVac);

  // Fallback Detection for Sample 2 (Fixed Sick-Only with Qty) if above fails for some reason?
  // Actually the dynamic logic should cover Sample 2 (Sick only) as well if it follows the pattern.
  // But let's keep the logic clean.

  // Determine kind based on format. 
  const reportKind = (hasSick || sickRateColIdx >= 0) ? 'sick_summary' : 'payroll';

  const imp = await client.query(
    `
    INSERT INTO imports(report_kind, imported_by, hotel, source_filename, rows_total, rows_ok, rows_skipped, year)
    VALUES($1, $2, $3, $4, 0, 0, 0, $5)
    RETURNING id
    `,
    [reportKind, importedBy, hotel, filename, year || null]
  );

  const importId = imp.rows[0].id;
  const storedFilename = storeCsvToDisk(importId, reportKind, filename, csvText);
  await client.query(`UPDATE imports SET stored_filename = $1 WHERE id = $2`, [storedFilename, importId]);

  if (rows.length === 0) {
    await client.query(`UPDATE imports SET rows_total = 0, rows_ok = 0, rows_skipped = 0 WHERE id = $1`, [importId]);
    return { importId, rowsTotal: 0, rowsOk: 0, rowsSkipped: 0 };
  }

  let rowsTotal = 0;
  let rowsOk = 0;
  let rowsSkipped = 0;

  // MODE A3: Dynamic Block Parsing (Sample 3 / 4)
  if (isSample3Dynamic) {
    // Start from row 3 (index 2)
    rowsTotal = rows.length - 2;

    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      const name = normalizeEmployeeKey(row[0]);

      if (!name || name.toUpperCase() === "TOTAL") {
        rowsSkipped++;
        continue;
      }

      // Dynamic Mapping
      // Start at Col 1 (B)
      let colIdx = 1;

      let berHours = null, berAmount = null;
      let sickHours = null, sickAmount = null;
      let vacHours = null, vacAmount = null;

      if (hasBer) {
        berHours = toNumberOrNull(row[colIdx]);
        berAmount = toNumberOrNull(row[colIdx + 1]);
        colIdx += 2;
      }

      if (hasSick) {
        sickHours = toNumberOrNull(row[colIdx]);
        sickAmount = toNumberOrNull(row[colIdx + 1]);
        colIdx += 2;
      }

      /*
      if (hasVac) {
        vacHours = toNumberOrNull(row[colIdx]);
        vacAmount = toNumberOrNull(row[colIdx + 1]);
        colIdx += 2;
      }
      */
      // Force NULL for Vacation from Sick Report
      vacHours = null;
      vacAmount = null;
      // If we skip the columns, we must skip the index! 
      if (hasVac) colIdx += 2;

      const empId = await upsertEmployee(client, name);

      await client.query(
        `INSERT INTO pto_balances(
      employee_id, import_id,
      vacation_hours, vacation_amount,
      sick_hours, sick_amount,
      bereavement_hours, bereavement_amount
    )
    VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
        [empId, importId, vacHours, vacAmount, sickHours, sickAmount, berHours, berAmount]
      );

      rowsOk++;
      await client.query(
        `INSERT INTO import_rows(import_id, row_number, employee_key, status, message, raw_json)
    VALUES($1, $2, $3, 'ok', 'Imported (Dynamic A3)', $4)`,
        [importId, i + 1, name, { berHours, berAmount, sickHours, sickAmount, vacHours, vacAmount }]
      );
    }
  }
  // MODE A1: List Format (Sick Summary Report - Sample 1)
  else if (sickRateColIdx >= 0) {
    // Start from row 2 (index 1)
    rowsTotal = rows.length - 1;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = normalizeEmployeeKey(row[0]);

      if (!name || name.toUpperCase() === "TOTAL") {
        rowsSkipped++;
        continue;
      }

      // Sample 1 had only amounts. We mapped it to both as a fallback.
      const val = row[sickRateColIdx];
      const sickVal = toNumberOrNull(val);

      const sickAmount = sickVal;
      const sickHours = sickVal;

      const empId = await upsertEmployee(client, name);

      await client.query(
        `INSERT INTO pto_balances(employee_id, import_id, vacation_hours, sick_hours, sick_amount)
    VALUES($1, $2, NULL, $3, $4)`,
        [empId, importId, sickHours, sickAmount]
      );

      rowsOk++;
      await client.query(
        `INSERT INTO import_rows(import_id, row_number, employee_key, status, message, raw_json)
    VALUES($1, $2, $3, 'ok', 'Imported (Sick Summary A1)', $4)`,
        [importId, i + 1, name, { sickVal: val }]
      );
    }
  }
  // MODE B: Matrix Format (Legacy Payroll Summary) -> kind='payroll'
  else {
    // 1. Identify Employees from Header Row (Row 1)
    const header = rows[0].map((c) => normalizeEmployeeKey(c));
    const employees = [];
    let empCounter = 0;

    for (let i = 1; i < header.length; i++) {
      const name = header[i];
      if (!name) continue;
      if (name.toUpperCase() === "TOTAL") break;
      // Stride 3 logic
      const dataIndex = 1 + (empCounter * 3);
      employees.push({ employeeKey: name, dataIndex: dataIndex });
      empCounter++;
    }

    // 2. Find "Sick Hourly Rate" Row
    const findRowByLabel = (label) => {
      const target = String(label).trim().toLowerCase();
      return rows.find((r) => String(r[0] || "").trim().toLowerCase().startsWith(target));
    };

    const sickRow = findRowByLabel("Sick Hourly Rate");
    rowsTotal = employees.length;

    if (!sickRow) {
      // Fail gracefully
      await client.query(
        `INSERT INTO import_rows(import_id, row_number, status, message, raw_json)
    VALUES($1, 1, 'error', 'Could not find row label: Sick Hourly Rate', $2)`,
        [importId, { labels: rows.map(r => r[0]) }]
      );
      rowsSkipped = rowsTotal;
    } else {
      // 3. Iterate
      for (const emp of employees) {
        const employeeKey = emp.employeeKey;
        const colIdx = emp.dataIndex;

        if (colIdx >= sickRow.length) { rowsSkipped++; continue; }

        const sickHoursVal = sickRow[colIdx];
        const sickAmountVal = sickRow[colIdx + 2];
        const sickHours = toNumberOrNull(sickHoursVal);
        const sickAmount = toNumberOrNull(sickAmountVal);

        if (!employeeKey) { rowsSkipped++; continue; }

        const empId = await upsertEmployee(client, employeeKey);
        await client.query(
          `INSERT INTO pto_balances(employee_id, import_id, vacation_hours, sick_hours, sick_amount)
    VALUES($1, $2, NULL, $3, $4)`,
          [empId, importId, sickHours, sickAmount]
        );

        rowsOk++;
        await client.query(
          `INSERT INTO import_rows(import_id, row_number, employee_key, status, message, raw_json)
    VALUES($1, 1, $2, 'ok', 'Imported (Matrix)', $3)`,
          [importId, employeeKey, { sickHours: sickHoursVal, sickAmount: sickAmountVal }]
        );
      }
    }
  }

  await client.query(
    `UPDATE imports SET rows_total = $1, rows_ok = $2, rows_skipped = $3 WHERE id = $4`,
    [rowsTotal, rowsOk, rowsSkipped, importId]
  );

  return { importId, rowsTotal, rowsOk, rowsSkipped };
}

async function importVacReport({ client, csvText, filename, importedBy, hotel, year }) {
  const rows = [];
  await new Promise((resolve, reject) => {
    parse(
      csvText,
      { bom: true, relax_column_count: true, skip_empty_lines: true, trim: true, columns: false },
      (err, output) => {
        if (err) return reject(err);
        output.forEach((r) => rows.push(r));
        resolve();
      }
    );
  });

  const imp = await client.query(
    `
    INSERT INTO imports(report_kind, imported_by, hotel, source_filename, rows_total, rows_ok, rows_skipped, year)
    VALUES('vac', $1, $2, $3, 0, 0, 0, $4)
    RETURNING id
    `,
    [importedBy, hotel, filename, year || null]
  );

  const importId = imp.rows[0].id;

  const storedFilename = storeCsvToDisk(importId, "vac", filename, csvText);
  await client.query(`UPDATE imports SET stored_filename = $1 WHERE id = $2`, [storedFilename, importId]);

  if (rows.length === 0) {
    await client.query(`UPDATE imports SET rows_total = 0, rows_ok = 0, rows_skipped = 0 WHERE id = $1`, [importId]);
    return { importId, rowsTotal: 0, rowsOk: 0, rowsSkipped: 0 };
  }

  const header = rows[0].map((c) => normalizeEmployeeKey(c));
  const names = [];
  for (let i = 1; i < header.length; i++) {
    const name = header[i];
    if (!name) continue;
    if (name.toUpperCase() === "TOTAL") break;
    names.push({ colIndex: i, employeeKey: name });
  }

  const findRowByLabel = (label) => {
    const target = String(label).trim().toLowerCase();
    return rows.find((r) => String(r[0] || "").trim().toLowerCase() === target);
  };

  const vacAvailRow = findRowByLabel("Vacation Pay Available");

  let rowsTotal = names.length;
  let rowsOk = 0;
  let rowsSkipped = 0;

  if (!vacAvailRow) {
    await client.query(
      `INSERT INTO import_rows(import_id, row_number, status, message, raw_json)
    VALUES($1, 1, 'error', 'Could not find row label: Vacation Pay Available', $2)`,
      [importId, { labels: rows.map(r => r[0]) }]
    );
    await client.query(`UPDATE imports SET rows_total = $1, rows_ok = 0, rows_skipped = $2 WHERE id = $3`, [
      rowsTotal, rowsTotal, importId
    ]);
    return { importId, rowsTotal, rowsOk: 0, rowsSkipped: rowsTotal };
  }

  for (const n of names) {
    const employeeKey = n.employeeKey;
    const vacationVal = vacAvailRow[n.colIndex];
    const vacationAmount = toNumberOrNull(vacationVal);

    if (!employeeKey) {
      rowsSkipped++;
      continue;
    }

    const empId = await upsertEmployee(client, employeeKey);

    await client.query(
      `INSERT INTO pto_balances(employee_id, import_id, vacation_amount, vacation_hours, sick_hours)
    VALUES($1, $2, $3, NULL, NULL)`,
      [empId, importId, vacationAmount]
    );

    rowsOk++;
    await client.query(
      `INSERT INTO import_rows(import_id, row_number, employee_key, status, message, raw_json)
    VALUES($1, 1, $2, 'ok', 'Imported (vac report)', $3)`,
      [importId, employeeKey, { vacation: vacationVal }]
    );
  }

  await client.query(`UPDATE imports SET rows_total = $1, rows_ok = $2, rows_skipped = $3 WHERE id = $4`, [
    rowsTotal, rowsOk, rowsSkipped, importId
  ]);

  return { importId, rowsTotal, rowsOk, rowsSkipped };
}

/** Unified import endpoint */
app.post("/api/import/csv", upload.single("file"), async (req, res) => {
  const file = req.file;
  const { reportKind, importedBy, hotel, year } = req.body;

  if (!file) return res.status(400).json({ ok: false, error: "No file uploaded." });

  const rk = String(reportKind || "").trim();
  if (!rk) return res.status(400).json({ ok: false, error: "reportKind is required (earnings or vac)." });

  const who = String(importedBy || "").trim();
  if (!who) return res.status(400).json({ ok: false, error: "Imported by is required." });

  const h = String(hotel || "").trim();
  if (!h || !isValidHotel(h)) return res.status(400).json({ ok: false, error: "Hotel is required." });

  const y = year ? Number(year) : null;

  const filename = file.originalname || "quickbooks.csv";
  const csvText = file.buffer.toString("utf-8");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let result;
    if (rk === "vac") result = await importVacReport({ client, csvText, filename, importedBy: who, hotel: h, year: y });
    else if (rk === "payroll" || rk === "earnings" || rk === "sick_summary") result = await importPayrollReport({ client, csvText, filename, importedBy: who, hotel: h, year: y });
    else return res.status(400).json({ ok: false, error: "Invalid reportKind." });

    await client.query("COMMIT");
    res.json({ ok: true, reportKind: rk, ...result, status: "OK" });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ ok: false, error: e.message });
  } finally {
    client.release();
  }
});

/* =========================
   v1.1 Settings API
========================= */
app.get("/api/settings/all", async (req, res) => {
  try {
    const hotels = await pool.query(`SELECT name FROM settings_hotels ORDER BY name`);
    const years = await pool.query(`SELECT year FROM settings_years ORDER BY year DESC`);
    const types = await pool.query(`SELECT name, max_allowed, min_allowed FROM settings_types ORDER BY name`);
    const vacOptions = await pool.query(`SELECT id, label, max_allowed FROM settings_vacation_options ORDER BY max_allowed, label`);
    res.json({
      ok: true,
      hotels: hotels.rows.map(r => r.name),
      years: years.rows.map(r => r.year),
      types: types.rows.map(r => ({ name: r.name, max_allowed: r.max_allowed, min_allowed: r.min_allowed })),
      vacation_options: vacOptions.rows,
    });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

/* =========================
   IP Allowlist Management (MUST BE BEFORE Generic Settings)
========================= */
app.get("/api/my-ip", (req, res) => {
  let ip = req.ip || req.connection.remoteAddress;
  if (ip.startsWith("::ffff:")) ip = ip.substring(7);
  res.json({ ip });
});

app.get("/api/settings/ips", requireAdmin, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM settings_ip_allowlist ORDER BY created_at DESC");
    res.json({ ok: true, ips: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

app.post("/api/settings/ips", requireAdmin, async (req, res) => {
  try {
    const { ip, description } = req.body;
    if (!ip) throw new Error("IP Address required");

    await pool.query(
      "INSERT INTO settings_ip_allowlist (ip_address, description) VALUES ($1, $2) ON CONFLICT (ip_address) DO UPDATE SET description = EXCLUDED.description",
      [ip, description || ""]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("Add IP Error:", e);
    res.status(500).json({ ok: false, message: e.message || "Server Error" });
  }
});

app.delete("/api/settings/ips/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM settings_ip_allowlist WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

app.get("/api/settings/sessions", requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT s.ip_address, s.user_agent, s.created_at, u.username 
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.expires_at > now()
      ORDER BY s.created_at DESC
    `);
    res.json({ ok: true, sessions: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

app.post("/api/settings/:kind", async (req, res) => {
  const { kind } = req.params;
  const { value } = req.body || {};
  if (!value) return res.json({ ok: false, error: "Missing value" });

  try {
    if (kind === "hotels") {
      await pool.query(`INSERT INTO settings_hotels(name) VALUES($1) ON CONFLICT(name) DO NOTHING`, [value]);
    } else if (kind === "years") {
      await pool.query(`INSERT INTO settings_years(year) VALUES($1) ON CONFLICT(year) DO NOTHING`, [Number(value)]);
    } else if (kind === "types") {
      const { min_allowed, max_allowed } = req.body || {};
      await pool.query(`INSERT INTO settings_types(name, min_allowed, max_allowed) VALUES($1, $2, $3) ON CONFLICT(name) DO NOTHING`, [value, Number(min_allowed) || null, Number(max_allowed) || null]);
    } else {
      return res.json({ ok: false, error: "Invalid kind" });
    }
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

app.post("/api/settings/:kind/rename", async (req, res) => {
  const { kind } = req.params;
  const { oldValue, newValue, hotel } = req.body || {};
  if (!oldValue || !newValue) return res.json({ ok: false, error: "Missing oldValue/newValue" });

  try {
    // Block rename if used anywhere (keep DB as-is)
    const col = kind === "years" ? "year" : "name";
    const oldKey = kind === "years" ? Number(oldValue) : oldValue;

    // Usage checks
    let usedCount = 0;
    if (kind === "hotels") {
      const u1 = await pool.query(`SELECT COUNT(*)::int AS c FROM imports WHERE hotel = $1`, [oldKey]).catch(() => ({ rows: [{ c: 0 }] }));
      const u2 = await pool.query(`SELECT COUNT(*)::int AS c FROM manual_entries WHERE hotel = $1`, [oldKey]);
      usedCount = (u1.rows[0]?.c || 0) + (u2.rows[0]?.c || 0);
    } else if (kind === "years") {
      const u = await pool.query(`SELECT COUNT(*)::int AS c FROM manual_entries WHERE year = $1`, [oldKey]);
      usedCount = u.rows[0]?.c || 0;
    } else if (kind === "types") {
      // Check usage for THIS hotel
      if (!hotel) return res.json({ ok: false, error: "Hotel is required for types rename." });
      const u = await pool.query(`SELECT COUNT(*)::int AS c FROM manual_entries WHERE type = $1 AND hotel = $2`, [oldKey, hotel]);
      usedCount = u.rows[0]?.c || 0;
    } else {
      return res.json({ ok: false, error: "Invalid kind" });
    }

    if (usedCount > 0) {
      return res.json({ ok: false, warning: "This item is already used. Rename is blocked to keep the database consistent." });
    }

    if (kind === "hotels") {
      await pool.query(`UPDATE settings_hotels SET name = $1 WHERE name = $2`, [newValue, oldValue]);
    } else if (kind === "years") {
      await pool.query(`UPDATE settings_years SET year = $1 WHERE year = $2`, [Number(newValue), Number(oldValue)]);
    } else if (kind === "types") {
      if (!hotel) return res.json({ ok: false, error: "Missing hotel" });
      await pool.query(`UPDATE settings_types SET name = $1 WHERE name = $2 AND hotel = $3`, [newValue, oldValue, hotel]);
    }

    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

app.post("/api/settings/types/update", async (req, res) => {
  try {
    const { name, hotel, min_allowed, max_allowed } = req.body || {};
    if (!name) return res.json({ ok: false, error: "Missing name" });
    if (!hotel) return res.json({ ok: false, error: "Missing hotel" });

    const maxA = max_allowed == null || String(max_allowed).trim() === "" ? null : Number(max_allowed);
    const minA = min_allowed == null || String(min_allowed).trim() === "" ? null : Number(min_allowed); // Allow 0

    // Ensure row exists (in case seeding missed it or new hotel)
    await pool.query(`
      INSERT INTO settings_types (hotel, name, max_allowed, min_allowed)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (hotel, name) 
      DO UPDATE SET max_allowed = EXCLUDED.max_allowed, min_allowed = EXCLUDED.min_allowed
    `, [hotel, name, maxA, minA]);

    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

app.post("/api/settings/vacation_options/update", async (req, res) => {
  try {
    const { id, label, max_allowed } = req.body || {};
    if (!id) return res.json({ ok: false, error: "Missing id" });
    const maxA = Number(max_allowed);
    if (Number.isNaN(maxA)) return res.json({ ok: false, error: "Invalid max_allowed" });
    if (label && String(label).trim() !== "") {
      await pool.query(`UPDATE settings_vacation_options SET label = $1, max_allowed = $2 WHERE id = $3`, [String(label).trim(), maxA, Number(id)]);
    } else {
      await pool.query(`UPDATE settings_vacation_options SET max_allowed = $1 WHERE id = $2`, [maxA, Number(id)]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

app.delete("/api/settings/:kind/:value", async (req, res) => {
  const { kind, value } = req.params;
  try {
    let usedCount = 0;

    if (kind === "hotels") {
      const u1 = await pool.query(`SELECT COUNT(*)::int AS c FROM imports WHERE hotel = $1`, [value]).catch(() => ({ rows: [{ c: 0 }] }));
      const u2 = await pool.query(`SELECT COUNT(*)::int AS c FROM manual_entries WHERE hotel = $1`, [value]);
      usedCount = (u1.rows[0]?.c || 0) + (u2.rows[0]?.c || 0);
      if (usedCount > 0) return res.json({ ok: false, warning: "Hotel already used. Cannot delete." });
      await pool.query(`DELETE FROM settings_hotels WHERE name = $1`, [value]);
      return res.json({ ok: true });
    }

    if (kind === "years") {
      const y = Number(value);
      const u = await pool.query(`SELECT COUNT(*)::int AS c FROM manual_entries WHERE year = $1`, [y]);
      if ((u.rows[0]?.c || 0) > 0) return res.json({ ok: false, warning: "Year already used. Cannot delete." });
      await pool.query(`DELETE FROM settings_years WHERE year = $1`, [y]);
      return res.json({ ok: true });
    }

    if (kind === "types") {
      const hotel = req.query.hotel;
      if (!hotel) return res.json({ ok: false, error: "Hotel required." });
      const u = await pool.query(`SELECT COUNT(*)::int AS c FROM manual_entries WHERE type = $1 AND hotel = $2`, [value, hotel]);
      if ((u.rows[0]?.c || 0) > 0) return res.json({ ok: false, warning: "Type already used. Cannot delete." });
      await pool.query(`DELETE FROM settings_types WHERE name = $1 AND hotel = $2`, [value, hotel]);
      return res.json({ ok: true });
    }

    if (kind === "vacation_options") {
      const id = Number(value);
      const u = await pool.query(`SELECT COUNT(*)::int AS c FROM employee_vacation_option WHERE vacation_option_id = $1`, [id]);
      if ((u.rows[0]?.c || 0) > 0) return res.json({ ok: false, warning: "Vacation option already assigned. Cannot delete." });
      await pool.query(`DELETE FROM settings_vacation_options WHERE id = $1`, [id]);
      return res.json({ ok: true });
    }

    res.json({ ok: false, error: "Invalid kind" });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

/* =========================
   Employee Vacation Option (v1.2)
========================= */
app.get("/api/employee-vacation-option", async (req, res) => {
  try {
    const hotel = String(req.query.hotel || "").trim();
    const employee = String(req.query.employee || "").trim();
    if (!hotel || !isValidHotel(hotel)) return res.status(400).json({ ok: false, error: "Valid hotel is required." });
    if (!employee) return res.status(400).json({ ok: false, error: "Employee is required." });

    const r = await pool.query(
      `SELECT vacation_option_id FROM employee_vacation_option WHERE hotel = $1 AND employee = $2`,
      [hotel, employee]
    );
    res.json({ ok: true, vacation_option_id: r.rows[0]?.vacation_option_id || null });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/employee-vacation-option", async (req, res) => {
  try {
    const { hotel, employee, vacation_option_id } = req.body || {};
    const h = String(hotel || "").trim();
    const emp = String(employee || "").trim();
    const vid = Number(vacation_option_id);
    if (!h || !isValidHotel(h)) return res.status(400).json({ ok: false, error: "Valid hotel is required." });
    if (!emp) return res.status(400).json({ ok: false, error: "Employee is required." });
    if (!vid || Number.isNaN(vid)) return res.status(400).json({ ok: false, error: "Valid vacation option is required." });

    // Ensure option exists
    const chk = await pool.query(`SELECT id FROM settings_vacation_options WHERE id = $1`, [vid]);
    if (chk.rowCount === 0) return res.status(400).json({ ok: false, error: "Vacation option not found." });

    await pool.query(
      `INSERT INTO employee_vacation_option(hotel, employee, vacation_option_id)
    VALUES($1, $2, $3)
       ON CONFLICT(hotel, employee) DO UPDATE SET vacation_option_id = EXCLUDED.vacation_option_id, updated_at = now()`,
      [h, emp, vid]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* =========================
   v1.1 Manual Entry API
========================= */
app.post("/api/manual-entry", async (req, res) => {
  try {
    const { hotel, employee, year, type, hours, note, from_date, to_date, days } = req.body || {};
    if (!hotel || !employee || !type) {
      return res.json({ ok: false, error: "Hotel, employee, and type are required." });
    }

    // Compute days if missing and dates provided
    let computedDays = days;
    const fd = from_date ? String(from_date) : null;
    const td = to_date ? String(to_date) : null;

    if ((computedDays === null || computedDays === undefined || computedDays === "") && fd && td) {
      const a = new Date(fd + "T00:00:00");
      const b = new Date(td + "T00:00:00");
      if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime())) {
        const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
        computedDays = diff >= 0 ? (diff + 1) : null;
      }
    }

    await pool.query(
      `INSERT INTO manual_entries(hotel, employee, year, type, hours, note, from_date, to_date, days, allocated_year)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        hotel,
        employee,
        Number(year || new Date().getFullYear()),
        type,
        hours === null || hours === "" || hours === undefined ? null : Number(hours),
        note || null,
        fd,
        td,
        computedDays === null || computedDays === undefined || computedDays === "" ? null : Number(computedDays),
        req.body.allocated_year ? Number(req.body.allocated_year) : null
      ]
    );

    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

app.put("/api/manual-entry/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { days, note, from_date, to_date, type, allocated_year } = req.body || {};

    const updates = [];
    const values = [];
    let idx = 1;

    if (days !== undefined) { updates.push(`days = $${idx++}`); values.push(days === "" ? null : Number(days)); }
    if (note !== undefined) { updates.push(`note = $${idx++}`); values.push(note); }
    if (type !== undefined) { updates.push(`type = $${idx++}`); values.push(type); }

    // Date Handling
    if (from_date !== undefined) {
      updates.push(`from_date = $${idx++}`);
      values.push(from_date === "" ? null : from_date);
    }
    if (to_date !== undefined) {
      updates.push(`to_date = $${idx++}`);
      values.push(to_date === "" ? null : to_date);
    }

    // Allocated Year
    if (allocated_year !== undefined) {
      updates.push(`allocated_year = $${idx++}`);
      values.push(allocated_year === "" || allocated_year === null ? null : Number(allocated_year));
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(`UPDATE manual_entries SET ${updates.join(", ")} WHERE id = $${idx}`, values);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.delete("/api/manual-entry/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM manual_entries WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* =========================
   Settings APIs
========================= */
app.get("/api/settings/types", async (req, res) => {
  try {
    const hotel = req.query.hotel;
    if (!hotel) return res.json({ ok: true, rows: [] }); // UI should handle selecting a default
    const r = await pool.query("SELECT * FROM settings_types WHERE hotel = $1 ORDER BY name", [hotel]);
    res.json({ ok: true, rows: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/settings/years", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM settings_years ORDER BY year DESC");
    res.json({ ok: true, years: r.rows.map(row => row.year) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/settings/all", async (req, res) => {
  try {
    const hotels = await pool.query("SELECT * FROM settings_hotels ORDER BY name");
    const years = await pool.query("SELECT * FROM settings_years ORDER BY year DESC");
    const types = await pool.query("SELECT * FROM settings_types ORDER BY name");
    const vacOpts = await pool.query("SELECT * FROM settings_vacation_options ORDER BY max_allowed");

    res.json({
      ok: true,
      hotels: hotels.rows.map(r => r.name),
      years: years.rows.map(r => r.year),
      types: types.rows.map(r => r.name), // Legacy list
      typeObjects: types.rows, // Full objects with max_allowed
      vacationOptions: vacOpts.rows
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* =========================
   Reports (v1.3.3) - manual only for taken days
========================= */
// GET Opening Balances for Settings (Restored)
app.get("/api/settings/opening-balances", async (req, res) => {
  try {
    const hotel = String(req.query.hotel || "").trim();
    if (!hotel || !isValidHotel(hotel)) {
      return res.status(400).json({ ok: false, error: "Valid hotel is required." });
    }

    // Latest accrued vacation from imports (hours -> days using 8h/day)
    const accruedQ = `
      SELECT e.employee_key, e.is_active, e.id AS employee_id,
             e.opening_vac_amount, e.opening_vac_hours, 
             e.opening_sick_amount, e.opening_sick_hours, 
             e.vacation_days_allowed,
      (
        SELECT json_build_object(
          'year', i.year,
          'vacation_hours', NULLIF((row_to_json(b):: jsonb ->> 'vacation_hours'), ''):: numeric,
            'vacation_amount', NULLIF((row_to_json(b):: jsonb ->> 'vacation_amount'), ''):: numeric,
              'sick_hours', NULLIF((row_to_json(b):: jsonb ->> 'sick_hours'), ''):: numeric,
                'sick_amount', NULLIF((row_to_json(b):: jsonb ->> 'sick_amount'), ''):: numeric,
                  'bereavement_hours', NULLIF((row_to_json(b):: jsonb ->> 'bereavement_hours'), ''):: numeric,
                    'bereavement_amount', NULLIF((row_to_json(b):: jsonb ->> 'bereavement_amount'), ''):: numeric
               )
               FROM pto_balances b
               JOIN imports i ON i.id = b.import_id
               WHERE b.employee_id = e.id AND i.hotel = $1
AND(
  NULLIF((row_to_json(b):: jsonb ->> 'vacation_hours'), '')::numeric IS NOT NULL OR
NULLIF((row_to_json(b):: jsonb ->> 'sick_hours'), '')::numeric IS NOT NULL
               )
               ORDER BY i.created_at DESC
               LIMIT 1
             ) AS balances
      FROM employees e
      WHERE 
         -- Explicitly associated with THIS hotel via any means
         EXISTS (SELECT 1 FROM manual_entries me WHERE me.employee = e.employee_key AND me.hotel = $1)
         OR EXISTS (SELECT 1 FROM employee_vacation_option evo WHERE evo.employee = e.employee_key AND evo.hotel = $1)
         OR EXISTS (SELECT 1 FROM pto_balances b JOIN imports i ON i.id = b.import_id WHERE b.employee_id = e.id AND i.hotel = $1)
  `;

    console.log(`[DEBUG] Opening Balances for Hotel: "${hotel}"`);
    const accruedR = await pool.query(accruedQ, [hotel]);
    console.log(`[DEBUG] Count: ${accruedR.rowCount}`);

    // Manual taken days (manual only)
    const takenQ = `
      SELECT employee,
  COALESCE(SUM(CASE WHEN lower(type) LIKE '%vac%' THEN days ELSE 0 END), 0) AS vacation_taken_days,
    COALESCE(SUM(CASE WHEN lower(type) LIKE '%sick%' THEN days ELSE 0 END), 0) AS sick_taken_days
      FROM manual_entries
      WHERE hotel = $1
      GROUP BY employee
  `;
    const takenR = await pool.query(takenQ, [hotel]);
    const takenMap = new Map(takenR.rows.map(r => [r.employee, r]));

    const rows = accruedR.rows.map(r => {
      const b = r.balances || {};
      const year = b.year ? Number(b.year) : null;
      const vacHrs = b.vacation_hours == null ? null : Number(b.vacation_hours);
      const vacAmt = b.vacation_amount == null ? null : Number(b.vacation_amount);
      const sickHrs = b.sick_hours == null ? null : Number(b.sick_hours);
      const sickAmt = b.sick_amount == null ? null : Number(b.sick_amount);
      const berHrs = b.bereavement_hours == null ? null : Number(b.bereavement_hours);
      const berAmt = b.bereavement_amount == null ? null : Number(b.bereavement_amount);

      const t = takenMap.get(r.employee) || { vacation_taken_days: 0, sick_taken_days: 0 };

      // Accrued Vac Days = Hours / 8 (fallback)
      const accruedVacDays = vacHrs == null ? null : (vacHrs / 8);

      return {
        id: r.employee_id, // Pass ID for editing
        employee_key: r.employee_key,
        isActive: (r.is_active !== false),

        // Manual Overrides (for display/edit in Opening Balances)
        opening_vac_amount: r.opening_vac_amount != null ? Number(r.opening_vac_amount) : null,
        opening_vac_hours: r.opening_vac_hours != null ? Number(r.opening_vac_hours) : null,
        opening_sick_amount: r.opening_sick_amount != null ? Number(r.opening_sick_amount) : null,
        opening_sick_hours: r.opening_sick_hours != null ? Number(r.opening_sick_hours) : null,
        vacation_days_allowed: r.vacation_days_allowed != null ? Number(r.vacation_days_allowed) : null,

        vacation_hours: vacHrs,
        vacation_amount: vacAmt,
        sick_hours: sickHrs,
        sick_amount: sickAmt,
        bereavement_hours: berHrs,
        bereavement_amount: berAmt,

        accrued_vac_days: accruedVacDays,
        vacation_taken_days: Number(t.vacation_taken_days || 0),
        sick_taken_days: Number(t.sick_taken_days || 0),
        year: r.year || null
      };
    });

    rows.sort((a, b) => {
      const aTot = String(a.employee_key).trim().toUpperCase() === "TOTAL";
      const bTot = String(b.employee_key).trim().toUpperCase() === "TOTAL";
      if (aTot && !bTot) return 1;
      if (!aTot && bTot) return -1;
      return String(a.employee_key).localeCompare(String(b.employee_key));
    });

    res.json({ ok: true, hotel, rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// QB & Reporting Services
const { sendQbCommand } = require("./services/qbService");
const ReportService = require("./services/reportService");

app.get("/api/qb/test", async (req, res) => {
  try {
    const result = await sendQbCommand("test");
    res.json(result);
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
});

app.get("/api/qb/employees", async (req, res) => {
  try {
    // 1. Validate Company OPEN in QB (Safety Check)
    const targetHotel = String(req.query.hotel || "").trim();
    if (targetHotel && HOTEL_COMPANY_MAP[targetHotel]) {
      const expected = HOTEL_COMPANY_MAP[targetHotel];
      const info = await sendQbCommand("get-company-info");
      if (info.status === "ok") {
        const actual = info.company_name || "";
        const legal = info.legal_name || "";
        if (!actual.toLowerCase().includes(expected.toLowerCase()) &&
          !legal.toLowerCase().includes(expected.toLowerCase())) {
          throw new Error(
            `WRONG COMPANY OPEN. \n` +
            `You Selected: ${targetHotel}\n` +
            `QuickBooks Open Company: ${actual} (${legal})\n` +
            `Please open "${expected}" in QuickBooks and try again.`
          );
        }
      }
    }

    const result = await sendQbCommand("get-employees");

    if (result.status === "ok" && Array.isArray(result.employees)) {
      console.log("=== DEBUG ACCRUAL DATA FOR CHRIS ===");
      const chris = result.employees.filter(e => e.name && e.name.includes("Chris"));
      console.log(JSON.stringify(chris, null, 2));
      console.log("=====================================");

      // UPSERT Employees (Metadata)
      for (const emp of result.employees) {
        const name = String(emp.name || "").trim();
        if (!name) continue;

        const isActive = (emp.is_active === true || emp.is_active === "true");
        await pool.query(`
              INSERT INTO employees (
                  employee_key, display_name, is_active, 
                  account_number, email, phone, hired_date, birth_date, job_title, address, hotel,
                  vacation_accrual_period, vacation_hours_accrued, vacation_max_hours, vacation_reset_yearly, vacation_hours_used,
                  sick_hours_available, sick_accrual_period, sick_hours_accrued, sick_max_hours, sick_reset_yearly, sick_hours_used
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
              ON CONFLICT (employee_key) DO UPDATE SET 
                 display_name = EXCLUDED.display_name,
                 is_active = EXCLUDED.is_active,
                 account_number = EXCLUDED.account_number,
                 email = EXCLUDED.email,
                 phone = EXCLUDED.phone,
                 hired_date = EXCLUDED.hired_date,
                 birth_date = EXCLUDED.birth_date,
                 job_title = EXCLUDED.job_title,
                 address = EXCLUDED.address,
                 hotel = EXCLUDED.hotel,
                 vacation_accrual_period = EXCLUDED.vacation_accrual_period,
                 vacation_hours_accrued = EXCLUDED.vacation_hours_accrued,
                 vacation_max_hours = EXCLUDED.vacation_max_hours,
                 vacation_reset_yearly = EXCLUDED.vacation_reset_yearly,
                 vacation_hours_used = EXCLUDED.vacation_hours_used,
                 sick_hours_available = EXCLUDED.sick_hours_available,
                 sick_accrual_period = EXCLUDED.sick_accrual_period,
                 sick_hours_accrued = EXCLUDED.sick_hours_accrued,
                 sick_max_hours = EXCLUDED.sick_max_hours,
                 sick_reset_yearly = EXCLUDED.sick_reset_yearly,
                 sick_hours_used = EXCLUDED.sick_hours_used
           `, [
          name, name, isActive,
          emp.account_number || null,
          emp.email || null,
          emp.phone || null,
          emp.hired_date || null,
          emp.birth_date || null,
          emp.job_title || null,
          emp.address || null,
          targetHotel || null, // Update hotel!
          emp.vacation_accrual_period || null,
          emp.vacation_hours_accrued || 0,
          emp.vacation_max_hours || 0,
          emp.vacation_reset_yearly || false,
          emp.vacation_hours_used || 0,
          emp.sick_hours_available || 0,
          emp.sick_accrual_period || null,
          emp.sick_hours_accrued || 0,
          emp.sick_max_hours || 0,
          emp.sick_reset_yearly || false,
          emp.sick_hours_used || 0
        ]);
      }
      // Log History
      const user = req.user ? req.user.username : 'system';
      await pool.query(
        `INSERT INTO sync_history (username, details, status, hotel) VALUES ($1, $2, $3, $4)`,
        [user, `Synced ${result.employees.length} employees`, 'Success', targetHotel]
      );
    }

    res.json(result);
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
});

// NEW: Report-Based Sync for accurate Vacation Balances
// MAPPING: Hotel Name -> Expected QB Company Name (or part of it)
const HOTEL_COMPANY_MAP = {
  "Holiday Inn & Suites -2565 Argentia": "West Star Hotels",
  "Holiday Inn Express & Suites - 5599 Ambler": "West Star Hospitality"
};

// NEW: Report-Based Sync for accurate Vacation Balances
app.get("/api/qb/sync-vacation", async (req, res) => {
  try {
    // 1. Validate Company OPEN in QB
    const targetHotel = String(req.query.hotel || "").trim();
    if (targetHotel && HOTEL_COMPANY_MAP[targetHotel]) {
      const expected = HOTEL_COMPANY_MAP[targetHotel];
      const info = await sendQbCommand("get-company-info");

      if (info.status === "ok") {
        const actual = info.company_name || "";
        const legal = info.legal_name || "";
        // Check if either Actual or Legal contains the Expected string (Case Insensitive)
        if (!actual.toLowerCase().includes(expected.toLowerCase()) &&
          !legal.toLowerCase().includes(expected.toLowerCase())) {

          throw new Error(
            `WRONG COMPANY OPEN. \n` +
            `You Selected: ${targetHotel}\n` +
            `QuickBooks Open Company: ${actual} (${legal})\n` +
            `Please open "${expected}" in QuickBooks and try again.`
          );
        }
      } else {
        // If command not supported yet (old connector running?), warn but proceed?
        // Or if error (e.g. no company open), fail.
        if (info.message && info.message.includes("Unknown action")) {
          console.warn("Connector does not support get-company-info. Skipping check.");
        } else {
          throw new Error("Could not verify QB Company: " + (info.message || "Unknown error"));
        }
      }
    }

    const result = await sendQbCommand("get-vacation-report");
    let stats = { foundRows: 0, updated: 0 };

    if (result.status === "ok" && Array.isArray(result.rows)) {
      // We need to calculate: Available = Accrued - (Hourly Used + Paid Out)
      // XML returns positive numbers for all columns, so we perform subtraction.

      // 1. Identify Rows (Fuzzy Match)
      // 1. Identify Rows (History - for Balance)
      const hAvail = result.rows.find(r => r.label && r.label.toLowerCase().includes("available") && r.label.toLowerCase().includes("vacation"));
      const hUsed = result.rows.find(r => r.label && (r.label.toLowerCase().includes("vacation hourly") || r.label.toLowerCase().includes("vacation salary")));
      const hAccrued = result.rows.find(r => r.label && r.label.toLowerCase().includes("accrued"));
      const hPaid = result.rows.find(r => r.label && r.label.toLowerCase().includes("paid"));

      // 2. Identify Rows (Current Year - for Usage Display)
      // Note: rows_current might be undefined if connector version is old, but we just updated it.
      const currentRows = result.rows_current || [];
      const cUsed = currentRows.find(r => r.label && (r.label.toLowerCase().includes("vacation hourly") || r.label.toLowerCase().includes("vacation salary")));
      const cPaid = currentRows.find(r => r.label && r.label.toLowerCase().includes("paid"));

      // 3. Identify Sick Pay Row (Current Year)
      const sRow = currentRows.find(r => r.label && (r.label.toLowerCase().includes("sick hourly") || r.label.toLowerCase().includes("sick salary")));
      // 4. Identify Bereavement Pay Row (Current Year)
      const bRow = currentRows.find(r => r.label && (r.label.toLowerCase().includes("bereavement hourly") || r.label.toLowerCase().includes("bereavement salary")));

      const allEmps = new Set();
      if (hAvail) Object.keys(hAvail.values).forEach(k => allEmps.add(k)); // Keys might have suffixes now! 
      if (hUsed) Object.keys(hUsed.values).forEach(k => allEmps.add(k));
      if (sRow) Object.keys(sRow.values).forEach(k => allEmps.add(k));
      if (bRow) Object.keys(bRow.values).forEach(k => allEmps.add(k));

      // Cleanup Suffixes for Emp Name Iteration
      // The keys in `values` are like "Baljinder_amt", "Baljinder_qty".
      // We need to normalize them to "Baljinder".
      const uniqueNames = new Set();
      const normalize = (set) => {
        set.forEach(k => {
          // Remove _qty, _rate, _amt suffixes if present
          let clean = k.replace(/_amt$/, "").replace(/_rate$/, "").replace(/_qty$/, "");
          uniqueNames.add(clean);
        });
      }
      if (hAvail) normalize(Object.keys(hAvail.values));
      if (hUsed) normalize(Object.keys(hUsed.values));
      if (sRow) normalize(Object.keys(sRow.values));
      if (bRow) normalize(Object.keys(bRow.values));

      if (uniqueNames.size > 0) {
        stats.foundRows = uniqueNames.size;

        for (const empName of uniqueNames) {
          const junk = ["TOTAL", "SALARY", "WAGES", "HOURLY", "ACCRUED", "PAYROLL", "NET PAY"];
          if (junk.some(j => empName.toUpperCase().includes(j))) continue;

          // Helper to get specific value type
          // If the connector returned suffixes:
          const getVal = (row, suffix = "") => {
            if (!row || !row.values) return 0;
            // Try exact match first
            let val = row.values[empName + suffix];
            // Fallback to no-suffix (legacy or if not split)
            if (val === undefined) val = row.values[empName];
            if (val === undefined) return 0;
            return parseFloat(String(val).replace(/,/g, '')) || 0;
          };

          let netBalance = 0;

          // BALANCE (From History - Usually just the Amount/Total column)
          // `hAvail` usually has Total amount in the "Amount" column (or implicit last col -> _amt)
          if (hAvail) {
            netBalance = getVal(hAvail, "_amt");
            if (netBalance === 0) netBalance = getVal(hAvail); // Fallback
          } else {
            const accrued = getVal(hAccrued, "_amt") || getVal(hAccrued);
            const used = getVal(hUsed, "_amt") || getVal(hUsed);
            const paid = getVal(hPaid, "_amt") || getVal(hPaid);
            netBalance = accrued - (used + paid);
          }

          // VACATION USAGE (Current Year)
          let usedAmount = 0;
          if (cUsed) {
            // Try to get Amount column specifically
            usedAmount = Math.abs(getVal(cUsed, "_amt"));
            if (usedAmount === 0) usedAmount = Math.abs(getVal(cUsed));
          }
          const valCPaid = cPaid ? (getVal(cPaid, "_amt") || getVal(cPaid)) : 0;
          usedAmount += Math.abs(valCPaid);

          // SICK PAY USAGE (Current Year)
          let sickHrs = 0;
          let sickAmt = 0;
          let sickDays = 0;

          if (sRow) {
            // Connector now returns _qty (Hours), _rate, _amt (Amount)
            // User: "first is hours(Sick Hours Used)" -> _qty
            // User: "Days Used is Amount/Rate" (which equals Hours if Rate is hourly)

            sickHrs = Math.abs(getVal(sRow, "_qty"));
            sickAmt = Math.abs(getVal(sRow, "_amt"));
            const rate = Math.abs(getVal(sRow, "_rate"));

            // If rate exists, Calc Days? 
            // User now requests: "Sick Days Used is = hours/8"
            sickDays = sickHrs / 8;
          }

          // BEREAVEMENT PAY USAGE (Current Year)
          let bereavHrs = 0;
          let bereavAmt = 0;
          let bereavDays = 0;

          if (bRow) {
            bereavHrs = Math.abs(getVal(bRow, "_qty"));
            bereavAmt = Math.abs(getVal(bRow, "_amt"));
            // Use Hours/8
            bereavDays = bereavHrs / 8;
          }

          await pool.query(`
                UPDATE employees 
                SET vacation_hours_available = $1,
                    vacation_used_amount = $2,
                    sick_used_hours = $4,
                    sick_used_amount = $5,
                    sick_days_used = $6,
                    bereavement_used_hours = $7,
                    bereavement_used_amount = $8,
                    bereavement_days_used = $9
                WHERE employee_key = $3
            `, [netBalance, usedAmount, empName, sickHrs, sickAmt, sickDays, bereavHrs, bereavAmt, bereavDays]);

          // LINK TO HOTEL if selected
          const targetHotel = String(req.query.hotel || "").trim();
          if (targetHotel && isValidHotel(targetHotel)) {
            // Need valid vacation_option_id
            const optRes = await pool.query('SELECT id FROM settings_vacation_options LIMIT 1');
            if (optRes.rows.length > 0) {
              const optId = optRes.rows[0].id;
              await pool.query(`
                   INSERT INTO employee_vacation_option(employee, hotel, vacation_option_id)
                   VALUES($1, $2, $3)
                   ON CONFLICT (hotel, employee) 
                   DO UPDATE SET vacation_option_id = EXCLUDED.vacation_option_id
                 `, [empName, targetHotel, optId]);
            }
          }

          stats.updated++;
        }
      }
    }

    // Log History
    // Log History
    try {
      const username = req.user ? req.user.username : (req.query.user || "system");
      const details = `Synced ${stats.foundRows || 0} employees. Updated ${stats.updated || 0} records.`;
      await pool.query(
        `INSERT INTO sync_history (username, details, status, hotel) VALUES ($1, $2, 'OK', $3)`,
        [username, details, targetHotel]
      );
    } catch (e) { console.error("Log failed", e); }

    res.json({ ...result, syncStats: stats });
  } catch (e) {
    console.error(e);
    // Log Error
    try {
      const username = req.user ? req.user.username : "system";
      await pool.query(
        `INSERT INTO sync_history (username, details, status) VALUES ($1, $2, 'ERROR')`,
        [username, "Sync failed: " + e.message]
      );
    } catch (ex) { }
    res.status(500).json({ status: "error", message: e.message });
  }
});

app.post("/api/export", async (req, res) => {
  try {
    const { data, columns, format, title } = req.body;
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ status: "error", message: "Invalid data provide" });
    }

    const filename = (title || "export").replace(/[^a-z0-9]/gi, "_");

    if (format === "xlsx") {
      const buffer = ReportService.generateExcel(data, columns, title);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}.xlsx`);
      res.send(buffer);
    } else if (format === "csv") {
      const csv = ReportService.generateCSV(data, columns);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}.csv`);
      res.send(csv);
    } else if (format === "pdf") {
      const buffer = await ReportService.generatePDF(data, columns, title);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}.pdf`);
      res.send(buffer);
    } else {
      res.status(400).json({ status: "error", message: "Unknown format" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: "error", message: e.message });
  }
});

/* =========================
   Reports V2 (Live Sync Data)
   ========================= */
app.get("/api/reports/summary-v2", async (req, res) => {
  try {
    const hotel = String(req.query.hotel || "").trim();
    if (!hotel || !isValidHotel(hotel)) {
      return res.status(400).json({ ok: false, error: "Valid hotel is required." });
    }

    // New logic: Prioritize 'employees' table columns (sick_used_hours, bereavement_used_hours)
    // while maintaining legacy fallback for Vacation if needed (though sync also updates vacation_days_allowed?)
    // This query fetches ALL employees associated with the hotel via:
    // 1. Employee Vacation Option (Manual Assign)
    // 2. Manual Entries
    // 3. Legacy Imports
    // 4. (Future) If Sync adds a 'hotel' column to employees, add it here.

    // Note: We select specific columns to ensure we get the live values.
    const q = `
      SELECT e.employee_key AS employee,
             e.sick_used_hours,
             e.bereavement_used_hours,
             e.vacation_hours_available,
             e.vacation_used_hours,
            (
                SELECT json_build_object(
                    'year', i.year,
                    'vacation_hours', NULLIF((row_to_json(b)::jsonb->>'vacation_hours'), '')::numeric,
                    'vacation_amount', NULLIF((row_to_json(b)::jsonb->>'vacation_amount'), '')::numeric,
                    'sick_hours', NULLIF((row_to_json(b)::jsonb->>'sick_hours'), '')::numeric,
                    'bereavement_hours', NULLIF((row_to_json(b)::jsonb->>'bereavement_hours'), '')::numeric
                )
                FROM pto_balances b
                JOIN imports i ON i.id = b.import_id
                WHERE b.employee_id = e.id AND i.hotel = $1
                ORDER BY i.created_at DESC
                LIMIT 1
            ) AS legacy_balances,
            (
                SELECT from_date::text 
                FROM manual_entries m 
                WHERE m.hotel = $1 
                  AND m.employee = e.employee_key 
                  AND m.type ILIKE '%Birthday%'
                  AND m.year = (
                      SELECT COALESCE(MAX(year), EXTRACT(YEAR FROM CURRENT_DATE)::int) 
                      FROM imports WHERE hotel = $1
                  )
                LIMIT 1
            ) as birthday_used_date
      FROM employees e
      WHERE 
         -- 1. Explicitly associated with THIS hotel
         EXISTS (SELECT 1 FROM employee_vacation_option evo WHERE evo.employee = e.employee_key AND evo.hotel = $1)
         OR EXISTS (SELECT 1 FROM manual_entries me WHERE me.employee = e.employee_key AND me.hotel = $1)
         OR EXISTS (SELECT 1 FROM pto_balances b JOIN imports i ON i.id = b.import_id WHERE b.employee_id = e.id AND i.hotel = $1)
         
         -- 2. OR Unassociated (Free Agents from Sync) - DISABLED to prevent cross-hotel leakage
         /*
         OR (
            NOT EXISTS (SELECT 1 FROM employee_vacation_option evo WHERE evo.employee = e.employee_key)
            AND NOT EXISTS (SELECT 1 FROM manual_entries me WHERE me.employee = e.employee_key)
            AND NOT EXISTS (SELECT 1 FROM pto_balances b WHERE b.employee_id = e.id)
         )
         */
    `;

    const r = await pool.query(q, [hotel]);

    // Format rows
    const rows = r.rows.map(row => {
      const lb = row.legacy_balances || {};

      // Sick & Bereavement: Use Live DB Values
      const sickHrs = row.sick_used_hours != null ? Number(row.sick_used_hours) : (lb.sick_hours ? Number(lb.sick_hours) : 0);
      const berHrs = row.bereavement_used_hours != null ? Number(row.bereavement_used_hours) : (lb.bereavement_hours ? Number(lb.bereavement_hours) : 0);

      // Vacation: Use Live if available? 
      // For now, let's keep it simple. If we have live, use it.
      // But the legacy report logic for "Vacation Pay Available" was complex from CSV.
      // We'll trust the Sync logic updated `vacation_hours_available` if sync ran.
      let vacHrs = row.vacation_hours_available != null ? Number(row.vacation_hours_available) : (lb.vacation_hours ? Number(lb.vacation_hours) : 0);

      return {
        employee: row.employee,
        sick_hours: sickHrs,
        bereavement_hours: berHrs,
        vacation_hours: vacHrs,
        // Add other fields if needed by existing frontend logic, but Warnings only need sick/bereav
        sick_amount: 0, // Placeholder
        bereavement_amount: 0, // Placeholder 
        accrued_vac_days: (vacHrs / 8),
        birthday_used_date: row.birthday_used_date // Format: YYYY-MM-DD
      };
    });

    // Sort
    rows.sort((a, b) => String(a.employee).localeCompare(String(b.employee)));

    res.json({ ok: true, hotel, rows });

  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- REPORTS API ---
app.get("/api/reports/data", async (req, res) => {
  const { hotel, type, year } = req.query;
  if (!hotel) return res.status(400).json({ ok: false, error: "Hotel required" });

  try {
    if (type === 'details') {
      // Report 2: Complete Employee Details
      const r = await pool.query(
        `SELECT * FROM employees WHERE hotel = $1 AND is_active = true ORDER BY employee_key ASC`,
        [hotel]
      );
      return res.json({ ok: true, rows: r.rows });
    }

    // Report 1: Vac/Sick/Brev Report
    // Query Balances & History
    // Report 1: Vac/Sick/Brev Report
    // Query Balances & History
    // manual_entries uses 'employee' (name) and 'from_date'
    let manualQ = `SELECT employee AS employee_key, type, from_date AS start_date, days, hours, note FROM manual_entries WHERE hotel = $1`;
    const manualEntries = (await pool.query(manualQ, [hotel])).rows;

    let importQ = `
      SELECT e.employee_key, i.year, 
             p.vacation_amount, p.vacation_hours, 
             p.sick_amount, p.sick_hours,
             p.bereavement_amount, p.bereavement_hours
      FROM pto_balances p
      JOIN imports i ON p.import_id = i.id
      JOIN employees e ON p.employee_id = e.id
      WHERE i.hotel = $1
    `;
    const importRows = (await pool.query(importQ, [hotel])).rows;

    const emps = await pool.query(`SELECT * FROM employees WHERE hotel = $1 AND is_active = true ORDER BY employee_key ASC`, [hotel]);

    const reportRows = emps.rows.map(e => {
      const key = e.employee_key;
      const filterYear = year ? Number(year) : null;
      const isYearMatch = (y) => !filterYear || Number(y) === filterYear;
      const isDateMatch = (d) => !filterYear || (new Date(d).getFullYear() === filterYear);

      let vacPaid = 0;
      let vacUsedDays = 0;

      let sickPaid = 0;
      let sickUsedHrs = 0;
      let sickUsedDays = 0;

      let berPaid = 0;
      let berUsedHrs = 0;
      let berUsedDays = 0;

      importRows.filter(r => r.employee_key === key && isYearMatch(r.year)).forEach(r => {
        if (r.vacation_amount) vacPaid += Number(r.vacation_amount);
        if (r.sick_amount) sickPaid += Number(r.sick_amount);
        if (r.bereavement_amount) berPaid += Number(r.bereavement_amount);
        if (r.bereavement_hours) berUsedHrs += Number(r.bereavement_hours);
        if (r.sick_hours) sickUsedHrs += Number(r.sick_hours);
      });

      manualEntries.filter(m => m.employee_key === key && isDateMatch(m.start_date)).forEach(m => {
        const d = Number(m.days || 0);
        const t = (m.type || "").toLowerCase();
        if (t.includes("vacation")) vacUsedDays += d;
        if (t.includes("sick")) sickUsedDays += d;
        if (t.includes("bereavement")) berUsedDays += d;
      });

      const notifs = [];
      if (!e.hired_date) notifs.push("Missing Hire Date");
      if (Number(e.vacation_hours_available || 0) < 0) notifs.push("Negative Vac Balance");
      if (Number(e.opening_vac_amount || 0) === 0 && Number(e.vacation_hours_available || 0) === 0) notifs.push("Zero Balance");

      return {
        id: e.id,
        employee: e.employee_key,
        job_title: e.job_title,
        vac_available_amt: (Number(e.vacation_hours_available || 0) + Number(e.opening_vac_amount || 0)),
        vac_available_hrs: 0,
        vac_pay_used: vacPaid,
        vac_days_input: vacUsedDays,
        sick_hrs_used: sickUsedHrs,
        sick_days_used: sickUsedDays,
        sick_amt_paid: sickPaid,
        ber_hrs_used: berUsedHrs,
        ber_days_used: berUsedDays,
        ber_amt_paid: berPaid,
        notifications: notifs.join("; ")
      };
    });

    res.json({ ok: true, rows: reportRows });

  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* =========================
   IP Allowlist Management
========================= */
app.get("/api/my-ip", (req, res) => {
  let ip = req.ip || req.connection.remoteAddress;
  if (ip.startsWith("::ffff:")) ip = ip.substring(7);
  res.json({ ip });
});

app.get("/api/settings/ips", requireAdmin, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM settings_ip_allowlist ORDER BY created_at DESC");
    res.json({ ok: true, ips: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

app.post("/api/settings/ips", requireAdmin, async (req, res) => {
  try {
    console.log("DEBUG: POST /api/settings/ips");
    console.log("Headers:", JSON.stringify(req.headers));
    console.log("Body:", JSON.stringify(req.body));

    const { ip, description } = req.body;

    if (!ip) throw new Error("IP Address required (received empty)");

    const query = "INSERT INTO settings_ip_allowlist (ip_address, description) VALUES ($1, $2) ON CONFLICT (ip_address) DO UPDATE SET description = EXCLUDED.description";
    const values = [ip, description || ""];

    console.log("DEBUG: Executing Query:", query);
    console.log("DEBUG: Values:", values);

    await pool.query(query, values);

    console.log("DEBUG: Query Success");
    res.json({ ok: true });
  } catch (e) {
    console.error("Add IP Error Stack:", e.stack);
    console.error("Add IP Message:", e.message);
    res.status(500).json({ ok: false, message: e.message || "Server Error" });
  }
});

app.delete("/api/settings/ips/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM settings_ip_allowlist WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

app.get("/api/settings/sessions", requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT s.ip_address, s.user_agent, s.created_at, u.username 
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.expires_at > now()
      ORDER BY s.created_at DESC
    `);
    res.json({ ok: true, sessions: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// --- DEDUCTION PAYMENTS & PAYROLL DATES ---

app.get("/api/payroll-dates", authMiddleware, async (req, res) => {
  const { hotel, year } = req.query;
  try {
    let q = "SELECT * FROM payroll_dates WHERE 1=1";
    let params = [];
    if (hotel) { params.push(hotel); q += ` AND hotel = $${params.length}`; }
    if (year) { params.push(year); q += ` AND year = $${params.length}`; }
    q += " ORDER BY year DESC, payroll_no DESC";
    const r = await pool.query(q, params);
    res.json({ ok: true, rows: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/payroll-dates", authMiddleware, async (req, res) => {
  const { hotel, year, payroll_no, pay_date, period_start, period_end } = req.body;
  if (!hotel || !year || !payroll_no) return res.status(400).json({ error: "Missing fields" });
  try {
    const r = await pool.query(`
      INSERT INTO payroll_dates (hotel, year, payroll_no, pay_date, period_start, period_end)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [hotel, year, payroll_no, pay_date || null, period_start || null, period_end || null]
    );
    res.json({ ok: true, row: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/payroll-dates/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM payroll_dates WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/deduction-summary", authMiddleware, async (req, res) => {
  const { payroll_date_id } = req.query;
  try {
    const r = await pool.query(`SELECT * FROM deduction_payments WHERE payroll_date_id = $1 ORDER BY created_at DESC`, [payroll_date_id]);
    res.json({ ok: true, rows: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

function parseCSVBuffer(buffer) {
  return new Promise((resolve, reject) => {
    parse(buffer.toString('utf8'), { relax_column_count: true }, (err, records) => {
      if (err) return reject(err);
      resolve(records);
    });
  });
}

function extractCurrency(val) {
  if (val === undefined || val === null) return 0;
  const cleaned = String(val).replace(/[$,\s]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

app.post("/api/sync-deductions", authMiddleware, upload.fields([{name: 'pd7a', maxCount: 1}, {name: 'summary', maxCount: 1}]), async (req, res) => {
  const { hotel, payroll_date_id } = req.body;
  const files = req.files;

  if (!hotel || !payroll_date_id) return res.status(400).json({ error: "Missing hotel or payroll date" });
  if (!files || !files.pd7a || !files.summary) return res.status(400).json({ error: "Missing pd7a or summary CSV files" });

  try {
    const pd7aRecords = await parseCSVBuffer(files.pd7a[0].buffer);
    const summaryRecords = await parseCSVBuffer(files.summary[0].buffer);

    let data = {
      fed_tax: 0,
      cpp_employee: 0, 
      cpp_company: 0,
      ei_employee: 0,
      ei_company: 0,
      employees_paid: 0,
      gross_pay: 0,
      net_pay: 0
    };

    pd7aRecords.forEach(row => {
      const col0 = String(row[0] || "").trim();
      const col1 = row.length > 1 ? row[1] : "";
      
      if (col0.startsWith("Tax deductions")) data.fed_tax = extractCurrency(col1);
      else if (col0.startsWith("CPP - Employee")) data.cpp_employee = extractCurrency(col1);
      else if (col0.startsWith("CPP - Company")) data.cpp_company = extractCurrency(col1);
      else if (col0.startsWith("EI - Employee")) data.ei_employee = extractCurrency(col1);
      else if (col0.startsWith("EI - Company")) data.ei_company = extractCurrency(col1);
      else if (col0.startsWith("No. of employees paid")) data.employees_paid = parseInt(extractCurrency(col1));
      else if (col0.startsWith("Gross payroll for period")) data.gross_pay = extractCurrency(col1);
    });

    summaryRecords.forEach(row => {
      const strRow = row.join(",").toLowerCase();
      if (strRow.includes("net pay") && !strRow.includes("gross")) {
        for(let i=1; i<row.length; i++) {
            let val = extractCurrency(row[i]);
            if (val > 0) { data.net_pay = val; break; }
        }
      }
      if (strRow.includes("gross pay") && !strRow.includes("adjusted") && !strRow.includes("total")) {
        for(let i=1; i<row.length; i++) {
            let val = extractCurrency(row[i]);
            if (val > 0 && data.gross_pay === 0) { data.gross_pay = val; break; }
        }
      }
    });

    // Delete existing records for this payroll_date_id
    await pool.query(`DELETE FROM deduction_payments WHERE payroll_date_id = $1`, [payroll_date_id]);

    const q = `
      INSERT INTO deduction_payments 
      (hotel, payroll_date_id, ei_employee, ei_company, cpp_employee, cpp_company, fed_tax, employees_paid, gross_pay, net_pay)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const inserted = await pool.query(q, [
      hotel, payroll_date_id, 
      data.ei_employee, data.ei_company, 
      data.cpp_employee, data.cpp_company, 
      data.fed_tax, data.employees_paid, 
      data.gross_pay, data.net_pay
    ]);

    res.json({ ok: true, data: data, row: inserted.rows[0] });

  } catch (e) {
    console.error("Deduction Sync Error:", e);
    res.status(500).json({ error: e.message });
  }
});

let server;
const pfxPath = path.join(__dirname, 'server.pfx');

if (fs.existsSync(pfxPath)) {
  console.log("🔒 Found server.pfx - Starting HTTPS Server...");
  const options = {
    pfx: fs.readFileSync(pfxPath),
    passphrase: 'password'
  };
  server = https.createServer(options, app).listen(PORT, () => {
    console.log(`Server running on port ${PORT} (HTTPS)`);
    console.log(`[HR System] running on https://localhost:${PORT}`);

    // Debug Local IPs
    const interfaces = os.networkInterfaces();
    const localIPs = [];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' || iface.family === 4) {
          if (!iface.internal) localIPs.push(iface.address);
        }
      }
    }
    console.log("DEBUG: Detected Local IPs:", localIPs);

    const displayIp = localIPs.length > 0 ? localIPs[0] : "localhost";
    console.log(`NOTE: Access via https://${displayIp}:${PORT}`);
    console.log("SERVER VERSION: v1.4.1 (Debug Mode)");
  });
} else {
  console.log("⚠️ No server.pfx found - Starting HTTP Server...");
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`[HR System] running on http://localhost:${PORT}`);
    console.log("SERVER VERSION: v1.4.0");
  });
}
