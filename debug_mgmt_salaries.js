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
        const q = `SELECT id, employee_key, job_title FROM employees WHERE job_title ILIKE '%Management Salaries%'`;
        const r = await pool.query(q);
        console.log(`Found ${r.rowCount} Management Salaries employees.`);
        r.rows.forEach(row => console.log(`${row.employee_key} (${row.hotel}) - Title: ${row.job_title}`));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
