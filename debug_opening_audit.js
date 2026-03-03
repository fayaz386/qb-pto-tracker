const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function run() {
    try {
        const hotelA = "2565 Argentia";
        const hotelB = "5599 Ambler";

        const q = `
      SELECT e.employee_key AS employee, e.id AS employee_id
      FROM employees e
      WHERE EXISTS(
        SELECT 1
        FROM pto_balances b
        JOIN imports i ON i.id = b.import_id
        WHERE b.employee_id = e.id AND i.hotel = $1
      )
      ORDER BY e.employee_key
    `;

        console.log(`--- Checking Hotel: ${hotelA} ---`);
        const rA = await pool.query(q, [hotelA]);
        console.log(`Count: ${rA.rowCount}`);
        rA.rows.slice(0, 5).forEach(r => console.log(` - ${r.employee}`));

        console.log(`\n--- Checking Hotel: ${hotelB} ---`);
        const rB = await pool.query(q, [hotelB]);
        console.log(`Count: ${rB.rowCount}`);
        rB.rows.slice(0, 5).forEach(r => console.log(` - ${r.employee}`));

        // Overlap check
        const setA = new Set(rA.rows.map(r => r.employee));
        const setB = new Set(rB.rows.map(r => r.employee));
        const overlap = [...setA].filter(x => setB.has(x));

        console.log(`\nOverlap Count: ${overlap.length}`);
        if (overlap.length > 0) {
            console.log("Sample Overlap:");
            overlap.slice(0, 5).forEach(name => console.log(` - ${name}`));

            // Detailed check for first overlap
            const name = overlap[0];
            const empRes = await pool.query("SELECT id FROM employees WHERE employee_key = $1", [name]);
            if (empRes.rows.length > 0) {
                const eid = empRes.rows[0].id;
                console.log(`\nDetailed Check for Overlap: ${name} (ID: ${eid})`);
                const pto = await pool.query(`
          SELECT i.hotel, i.created_at 
          FROM pto_balances b 
          JOIN imports i ON i.id = b.import_id 
          WHERE b.employee_id = $1
          ORDER BY i.created_at DESC
        `, [eid]);
                console.log("found in imports:", pto.rows);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
