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
        const ip = process.argv[2] || "192.168.0.134";
        const desc = process.argv[3] || "Whitelisted IP";
        console.log(`Adding ${ip} to dashboard allowlist...`);

        await pool.query(
            "INSERT INTO settings_ip_allowlist (ip_address, description) VALUES ($1, $2) ON CONFLICT (ip_address) DO UPDATE SET description = EXCLUDED.description",
            [ip, desc]
        );

        await pool.query(
            "INSERT INTO settings_ip_allowlist (ip_address, description) VALUES ($1, $2) ON CONFLICT (ip_address) DO UPDATE SET description = EXCLUDED.description",
            ["::ffff:" + ip, desc + " mapped"]
        );

        console.log("Success! Added to database.");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

addIPs();
