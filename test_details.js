require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'pto_tracker',
    password: process.env.PGPASSWORD || 'password',
    port: parseInt(process.env.PGPORT || '5432'),
});

async function run() {
    try {
        const eq = await pool.query(`SELECT employee_key, sick_used_hours, sick_used_amount, sick_hours_available FROM employees WHERE employee_key ILIKE '%Analee%' OR employee_key ILIKE '%Prudence%'`);
        console.log("Employees Matches:");
        console.table(eq.rows);

        // Also check manual entries
        const mq = await pool.query(`SELECT employee, year, type, hours, days, note, allocated_year FROM manual_entries WHERE type='Sick' AND (employee ILIKE '%Analee%' OR employee ILIKE '%Prudence%')`);
        console.log("Sick Manual Entries:");
        console.table(mq.rows.map(r => ({ ...r, note: r.note?.substring(0, 20) })));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
