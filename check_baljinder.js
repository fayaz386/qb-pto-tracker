require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

(async () => {
    try {
        const res = await pool.query("SELECT employee_key, account_number, job_title, address FROM employees WHERE employee_key LIKE '%Baljinder%'");
        console.log("DB Result:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
})();
