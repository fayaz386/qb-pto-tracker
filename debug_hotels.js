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
        const hotels = await pool.query(`SELECT * FROM settings_hotels`);
        console.log("Hotels:", hotels.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
