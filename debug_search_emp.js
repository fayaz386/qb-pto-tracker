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
        const q = `SELECT * FROM employees WHERE employee_key ILIKE '%Management%'`;
        const r = await pool.query(q);
        console.log(`Found ${r.rowCount} matches.`);
        r.rows.forEach(row => console.log(JSON.stringify(row, null, 2)));
    } catch (e) { console.error(e); } finally { pool.end(); }
}
run();
