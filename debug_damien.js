require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool();

(async () => {
    try {
        const res = await pool.query(`
      SELECT 
        e.employee_key, 
        i.year, 
        i.report_kind, 
        b.vacation_amount, 
        b.vacation_hours 
      FROM pto_balances b 
      JOIN employees e ON b.employee_id = e.id 
      JOIN imports i ON i.id = b.import_id 
      WHERE e.employee_key ILIKE '%Damien%' 
      ORDER BY i.year, i.created_at
    `);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
})();
