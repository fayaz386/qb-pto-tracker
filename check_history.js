const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'pto_tracker',
    password: process.env.DB_PASSWORD || 'dZUyADu!v%IT',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function check() {
    try {
        const res = await pool.query(`SELECT year, COUNT(*) FROM imports GROUP BY year ORDER BY year`);
        console.log("--- Imports by Year ---");
        if (res.rows.length === 0) console.log("No imports found.");
        res.rows.forEach(r => console.log(`${r.year}: ${r.count} records`));

        // Also check manual entries dates
        const man = await pool.query(`SELECT EXTRACT(YEAR FROM from_date) as yr, COUNT(*) FROM manual_entries GROUP BY yr ORDER BY yr`);
        console.log("\n--- Manual Entries by Year ---");
        if (man.rows.length === 0) console.log("No manual entries found.");
        man.rows.forEach(r => console.log(`${r.yr}: ${r.count} records`));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
