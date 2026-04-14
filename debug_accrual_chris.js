require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool();

pool.query(`
  SELECT id, report_kind, created_at, rules_json
  FROM imports
  ORDER BY created_at DESC
  LIMIT 5
`, (err, res) => {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(res.rows, null, 2));
  }
  pool.end();
});
