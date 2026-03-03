const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "pto_tracker",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
});

async function addIPs() {
    try {
        console.log("Adding 192.168.0.x subnet IPs to dashboard allowlist...");

        // Add explicitly known remote IPs
        await pool.query(
            "INSERT INTO settings_ip_allowlist (ip_address, description) VALUES ($1, $2) ON CONFLICT (ip_address) DO UPDATE SET description = EXCLUDED.description",
            ["192.168.0.134", "Main computer"]
        );

        // Sometimes it shows as IPv4-mapped IPv6 depending on network config
        await pool.query(
            "INSERT INTO settings_ip_allowlist (ip_address, description) VALUES ($1, $2) ON CONFLICT (ip_address) DO UPDATE SET description = EXCLUDED.description",
            ["::ffff:192.168.0.134", "Main computer mapped"]
        );

        console.log("Success! Added to database.");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

addIPs();
