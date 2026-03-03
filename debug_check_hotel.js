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
        const res = await pool.query(`SELECT COUNT(*) as total, COUNT(hotel) as with_hotel FROM employees`);
        console.log("Total Employees:", res.rows[0].total);
        console.log("Employees with Hotel:", res.rows[0].with_hotel);

        const hotels = await pool.query(`SELECT DISTINCT hotel FROM employees`);
        console.log("Hotels in Employees table:", hotels.rows.map(r => r.hotel));

        // Check if imports has hotels
        const imp = await pool.query(`SELECT DISTINCT hotel FROM imports`);
        console.log("Hotels in Imports:", imp.rows.map(r => r.hotel));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
