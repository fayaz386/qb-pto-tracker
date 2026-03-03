require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function check() {
    try {
        const res = await pool.query('SELECT hotel, year, count(*) FROM imports GROUP BY hotel, year ORDER BY year DESC');
        console.log("Imports found (JSON):");
        console.log(JSON.stringify(res.rows, null, 2));

        const empRes = await pool.query('SELECT count(*) FROM employees');
        console.log("Total Employees:", empRes.rows[0].count);

        // Check specific employee Arshpreet
        const arsh = await pool.query("SELECT * FROM employees WHERE employee_key ILIKE '%Arshpreet%'");
        console.log("Arshpreet Data:", JSON.stringify(arsh.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
