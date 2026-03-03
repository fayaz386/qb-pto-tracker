require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    const columns = [
        "ADD COLUMN IF NOT EXISTS account_number TEXT",
        "ADD COLUMN IF NOT EXISTS email TEXT",
        "ADD COLUMN IF NOT EXISTS phone TEXT",
        "ADD COLUMN IF NOT EXISTS hired_date TEXT",
        "ADD COLUMN IF NOT EXISTS birth_date TEXT",
        "ADD COLUMN IF NOT EXISTS job_title TEXT",
        "ADD COLUMN IF NOT EXISTS address TEXT",
        "ADD COLUMN IF NOT EXISTS hotel TEXT"
    ];

    try {
        console.log("Adding columns to employees table...");
        for (const cmd of columns) {
            await pool.query(`ALTER TABLE employees ${cmd}`);
        }

        console.log("Backfilling hotel column from imports...");
        await pool.query(`
          UPDATE employees e
          SET hotel = i.hotel
          FROM pto_balances p
          JOIN imports i ON p.import_id = i.id
          WHERE e.id = p.employee_id
          AND e.hotel IS NULL
        `);

        console.log("Backfilling hotel column from manual_entries...");
        await pool.query(`
          UPDATE employees e
          SET hotel = m.hotel
          FROM manual_entries m
          WHERE e.employee_key = m.employee
          AND e.hotel IS NULL
        `);

        // Final Fallback: Assign remaining orphans to 'Holiday Inn Express & Suites - 5599 Ambler'
        // (User Request: "it needs to list all employees" for Ambler)
        console.log("Assigning remaining orphans to 5599 Ambler...");
        await pool.query(`
          UPDATE employees 
          SET hotel = 'Holiday Inn Express & Suites - 5599 Ambler' 
          WHERE hotel IS NULL
        `);

        console.log("Values Updated.");
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

migrate();
