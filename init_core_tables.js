const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT,
});

async function initCore() {
    try {
        console.log("Creating core tables (employees, pto_balances, imports)...");

        // 1. Employees
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id SERIAL PRIMARY KEY,
                employee_key TEXT UNIQUE NOT NULL,
                display_name TEXT,
                is_active BOOLEAN,
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now(),
                opening_vac_amount NUMERIC DEFAULT 0,
                opening_vac_hours NUMERIC DEFAULT 0,
                opening_sick_amount NUMERIC DEFAULT 0,
                opening_sick_hours NUMERIC DEFAULT 0,
                vacation_hours_available NUMERIC DEFAULT 0,
                sick_hours_available NUMERIC DEFAULT 0,
                account_number TEXT,
                email TEXT,
                phone TEXT,
                hired_date TEXT,
                birth_date TEXT,
                job_title TEXT,
                address TEXT,
                vacation_used_hours NUMERIC,
                vacation_used_amount NUMERIC,
                sick_used_hours NUMERIC,
                sick_used_amount NUMERIC,
                sick_days_used NUMERIC,
                bereavement_used_hours NUMERIC,
                bereavement_used_amount NUMERIC,
                bereavement_days_used NUMERIC,
                vacation_days_allowed NUMERIC,
                hotel TEXT
            );
        `);
        console.log("Employees table checked.");

        // 2. Imports
        await pool.query(`
            CREATE TABLE IF NOT EXISTS imports (
                id SERIAL PRIMARY KEY,
                imported_by TEXT,
                source_filename TEXT,
                source_type TEXT,
                as_of_date DATE,
                vacation_col TEXT,
                sick_col TEXT,
                rows_total INTEGER,
                rows_ok INTEGER,
                rows_skipped INTEGER,
                created_at TIMESTAMPTZ DEFAULT now(),
                report_kind TEXT,
                source_csv TEXT,
                stored_filename TEXT,
                hotel TEXT,
                sick_amount_col TEXT,
                year INTEGER
            );
        `);
        console.log("Imports table checked.");

        // 3. PTO Balances
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pto_balances (
                id SERIAL PRIMARY KEY,
                employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
                import_id INTEGER REFERENCES imports(id) ON DELETE SET NULL,
                as_of_date DATE,
                vacation_hours NUMERIC,
                sick_hours NUMERIC,
                created_at TIMESTAMPTZ DEFAULT now(),
                sick_amount NUMERIC,
                bereavement_hours NUMERIC,
                bereavement_amount NUMERIC,
                vacation_amount NUMERIC,
                vacation_used_hours NUMERIC,
                vacation_used_amount NUMERIC,
                sick_used_hours NUMERIC,
                sick_used_amount NUMERIC,
                sick_days_used NUMERIC,
                bereavement_used_hours NUMERIC,
                bereavement_used_amount NUMERIC,
                bereavement_days_used NUMERIC
            );
        `);
        console.log("PTO Balances table checked.");

        console.log("Core tables initialized successfully!");
    } catch (e) {
        console.error("Migration Error:", e);
    } finally {
        pool.end();
    }
}

initCore();
