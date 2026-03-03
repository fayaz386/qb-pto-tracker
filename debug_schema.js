const { Pool } = require('pg');
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "pto_tracker",
    password: "dZUyADu!v%IT",
    port: 5432,
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'employees'
      ORDER BY ordinal_position
    `);

        console.log("Columns in 'employees' table:");
        res.rows.forEach(r => {
            console.log(` - ${r.column_name} (${r.data_type})`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

run();
