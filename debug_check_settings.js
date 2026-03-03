require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD
});

async function run() {
    try {
        console.log("Checking settings_types table...");

        // Check Columns
        const cols = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'settings_types'
    `);
        console.log("Columns:", cols.rows.map(r => r.column_name));

        // Check Data
        const data = await pool.query(`SELECT * FROM settings_types`);
        console.log("\nSettings Data:", data.rows);

        // Check Constraints
        const cons = await pool.query(`
        SELECT conname, pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE conrelid = 'settings_types'::regclass
    `);
        console.log("\nConstraints:", cons.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

run();
