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
        const tables = ['employees'];
        for (const t of tables) {
            console.log(`\n--- TABLE: ${t} ---`);
            const res = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${t}';
      `);
            res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
