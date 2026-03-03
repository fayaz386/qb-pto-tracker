const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "pto_tracker",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
});

async function run() {
    try {
        console.log("Checking database schema...");

        // 1. Create IP Allowlist Table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS settings_ip_allowlist (
        id SERIAL PRIMARY KEY,
        ip_address TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
        console.log("✅ Table 'settings_ip_allowlist' verified.");

        // 2. Add sessions columns
        await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;`);
        await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;`);
        console.log("✅ Table 'sessions' columns verified.");

        // 3. Test Select
        const r = await pool.query("SELECT COUNT(*) FROM settings_ip_allowlist");
        console.log(`Current Allowed IPs: ${r.rows[0].count}`);

        console.log("\nSUCCESS! Database is ready.");
    } catch (e) {
        console.error("❌ Error:", e.message);
    } finally {
        pool.end();
    }
}

run();
