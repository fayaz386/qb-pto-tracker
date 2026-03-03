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
        console.log("Checking DB Connection...");
        const res = await pool.query("SELECT NOW()");
        console.log("Connected:", res.rows[0]);

        console.log("\nChecking 'imports' table columns...");
        const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'imports'
    `);
        console.log("Columns:", cols.rows.map(r => r.column_name).join(", "));

        const hasYear = cols.rows.some(r => r.column_name === 'year');
        console.log("Has 'year' column?", hasYear);

        if (!hasYear) {
            console.log("CRITICAL: 'year' column missing! Attempting to add...");
            await pool.query("ALTER TABLE imports ADD COLUMN IF NOT EXISTS year INTEGER;");
            console.log("Added 'year' column.");
        }

        console.log("\nTesting historyQ...");
        const hQ = `
      SELECT
        i.created_at AS import_date,
        i.year,
        i.report_kind,
        i.imported_by,
        i.source_filename,
        NULLIF((row_to_json(b)::jsonb->>'vacation_hours'),'')::numeric AS vacation_hours,
        NULLIF((row_to_json(b)::jsonb->>'sick_hours'),'')::numeric AS sick_hours,
        NULLIF((row_to_json(b)::jsonb->>'sick_amount'),'')::numeric AS sick_amount
      FROM employees e
      JOIN pto_balances b ON b.employee_id = e.id
      JOIN imports i ON i.id = b.import_id
      LIMIT 1
    `;
        try {
            await pool.query(hQ, []);
            console.log("historyQ Logic Check: OK");
        } catch (e) {
            console.error("historyQ Failed:", e.message);
        }

    } catch (e) {
        console.error("Diagnosis Failed:", e);
    } finally {
        await pool.end();
    }
}

run();
