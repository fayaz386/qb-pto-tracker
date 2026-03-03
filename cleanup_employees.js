require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function cleanup() {
    try {
        console.log("Starting cleanup...");

        // 1. Delete by exact known bad names or patterns
        const patterns = [
            '%Salary%',
            '%Wages%',
            '%Hourly%',
            '%Tips-%',
            '%Tax%',
            '%CPP%',
            '%EI -%',
            '%WCB%',
            '%Deduction%',
            '%Dues%',
            '%Advance%',
            'Total',
            'Other Pay',
            'vacation_amount', // Sometimes header rows get in
            'vacation_hours',
            '%Gross%',
            '%Net Pay%',
            '%Accrued%',
            '%STAT Pay%'
        ];

        for (const pat of patterns) {
            const res = await pool.query(`DELETE FROM employees WHERE employee_key ILIKE $1 RETURNING employee_key`, [pat]);
            if (res.rowCount > 0) {
                console.log(`Deleted ${res.rowCount} rows matching '${pat}':`);
                console.log(res.rows.map(r => r.employee_key).join(', '));
            }
        }

        console.log("Cleanup complete.");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

cleanup();
