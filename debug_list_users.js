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
        const q = `SELECT * FROM users`;
        const r = await pool.query(q);
        console.log(`Found ${r.rowCount} users.`);
        r.rows.forEach(row => console.log(`${row.username} (${row.role})`));
    } catch (e) { console.error(e); } finally { pool.end(); }
}
run();
