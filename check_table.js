require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool();
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'employees'").then(res => {
  console.log(res.rows.map(r=>r.column_name));
  pool.end();
});
