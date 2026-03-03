const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT,
});

async function check() {
    try {
        console.log("--- Employee Hotel Distribution ---");
        const res = await pool.query(`SELECT hotel, COUNT(*) FROM employees GROUP BY hotel`);
        res.rows.forEach(r => console.log(`Hotel: '${r.hotel}' - Count: ${r.count}`));

        console.log("\n--- NULL Hotel Sample ---");
        const nulls = await pool.query(`SELECT employee_key FROM employees WHERE hotel IS NULL LIMIT 10`);
        nulls.rows.forEach(r => console.log(`Orphan: ${r.employee_key}`));

        console.log("\n--- Manual Entries Hotel Distribution ---");
        const man = await pool.query(`SELECT hotel, COUNT(DISTINCT employee) FROM manual_entries GROUP BY hotel`);
        man.rows.forEach(r => console.log(`Manual Hotel: '${r.hotel}' - Distinct Emps: ${r.count}`));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
