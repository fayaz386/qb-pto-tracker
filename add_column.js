
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
        console.log("Adding attachment_path column...");
        await pool.query("ALTER TABLE employee_notes ADD COLUMN IF NOT EXISTS attachment_path TEXT;");
        console.log("Success!");
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await pool.end();
    }
}

run();
