require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:dZUyADu!v%IT@localhost:5432/pto_tracker'
});

async function run() {
    try {
        const res = await pool.query("SELECT * FROM employees WHERE employee_key ILIKE '%Chris-Solo%'");
        console.log('Employee Record:', res.rows[0]);

        if (res.rows.length > 0) {
            const empKey = res.rows[0].employee_key;
            const hist = await pool.query("SELECT * FROM manual_entries WHERE employee = $1", [empKey]);
            console.log('Manual Entries Count:', hist.rows.length);
            console.log('Manual Entries:', hist.rows);

            const imports = await pool.query(`
            SELECT i.created_at, i.hotel, b.* 
            FROM pto_balances b
            JOIN imports i ON i.id = b.import_id
            WHERE b.employee_id = $1
            ORDER BY i.created_at DESC
        `, [res.rows[0].id]);
            console.log('Import History Count:', imports.rows.length);
            console.log('Import History (Top 3):', imports.rows.slice(0, 3));
        } else {
            console.log("No employee found matching 'Chris-Solo'");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
