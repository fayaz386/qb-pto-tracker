const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "pto_tracker",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
});

async function run() {
    try {
        console.log("--- Checking Recent Imports ---");
        const imports = await pool.query(`
      SELECT id, report_kind, created_at, hotel, rows_total, rows_ok, rows_skipped
      FROM imports 
      ORDER BY created_at DESC LIMIT 5
    `);
        console.log(JSON.stringify(imports.rows, null, 2));

        if (imports.rows.length > 0) {
            const lastId = imports.rows[0].id;
            console.log(`\n--- Checking Import Rows for Import ID ${lastId} ---`);
            // Only get one row to check structure
            const irows = await pool.query(`
        SELECT row_number, status, message, raw_json 
        FROM import_rows 
        WHERE import_id = $1 
        LIMIT 1
      `, [lastId]);
            console.log(JSON.stringify(irows.rows, null, 2));

            // Check balances for this import
            console.log(`\n--- Checking Balances for Import ID ${lastId} ---`);
            const balances = await pool.query(`
        SELECT count(*) as count, sum(sick_hours) as total_sick_hours, sum(sick_amount) as total_sick_amount
        FROM pto_balances
        WHERE import_id = $1
      `, [lastId]);
            console.log(JSON.stringify(balances.rows, null, 2));
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
