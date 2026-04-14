require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool();

async function check() {
  const r = await pool.query("SELECT employee_key, sick_hours_available, sick_hours_accrued, sick_hours_used, sick_used_hours FROM employees WHERE employee_key LIKE '%Ambika%'");
  console.log(r.rows);
  pool.end();
}

check();
