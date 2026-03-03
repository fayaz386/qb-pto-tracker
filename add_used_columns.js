const { Pool } = require('pg');
require("dotenv").config();

const pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
});

(async () => {
    try {
        console.log("Updating schema...");
        await pool.query(`
            ALTER TABLE pto_balances ADD COLUMN IF NOT EXISTS vacation_used_hours NUMERIC DEFAULT 0;
            ALTER TABLE pto_balances ADD COLUMN IF NOT EXISTS vacation_used_amount NUMERIC DEFAULT 0;
            ALTER TABLE pto_balances ADD COLUMN IF NOT EXISTS sick_used_hours NUMERIC DEFAULT 0;
            ALTER TABLE pto_balances ADD COLUMN IF NOT EXISTS sick_used_amount NUMERIC DEFAULT 0;
            ALTER TABLE pto_balances ADD COLUMN IF NOT EXISTS sick_days_used NUMERIC DEFAULT 0;
            ALTER TABLE pto_balances ADD COLUMN IF NOT EXISTS bereavement_used_hours NUMERIC DEFAULT 0;
            ALTER TABLE pto_balances ADD COLUMN IF NOT EXISTS bereavement_used_amount NUMERIC DEFAULT 0;
            ALTER TABLE pto_balances ADD COLUMN IF NOT EXISTS bereavement_days_used NUMERIC DEFAULT 0;
            
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS vacation_used_hours NUMERIC DEFAULT 0;
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS vacation_used_amount NUMERIC DEFAULT 0;
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS sick_used_hours NUMERIC DEFAULT 0;
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS sick_used_amount NUMERIC DEFAULT 0;
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS sick_days_used NUMERIC DEFAULT 0;
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS bereavement_used_hours NUMERIC DEFAULT 0;
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS bereavement_used_amount NUMERIC DEFAULT 0;
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS bereavement_days_used NUMERIC DEFAULT 0;
        `);
        console.log("Schema updated.");
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
})();
