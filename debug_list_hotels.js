const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function run() {
    try {
        console.log("--- Listing Imports Hotels ---");
        const r = await pool.query("SELECT DISTINCT hotel FROM imports");
        console.log(r.rows);

        const r2 = await pool.query("SELECT DISTINCT name FROM settings_hotels");
        console.log("--- Settings Hotels ---")
        console.log(r2.rows);

    } catch (e) { console.error(e); } finally { pool.end(); }
}
run();
