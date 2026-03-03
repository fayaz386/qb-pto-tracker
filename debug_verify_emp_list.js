require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD
});

async function run() {
    try {
        const hotels = await pool.query("SELECT name FROM settings_hotels ORDER BY name");
        console.log("Hotels:", hotels.rows.map(h => h.name));

        for (const h of hotels.rows) {
            const hotelName = h.name;
            console.log(`\nChecking employees for: ${hotelName}`);

            const q = `
          SELECT e.employee_key AS name
          FROM employees e
          WHERE
             EXISTS (SELECT 1 FROM pto_balances b JOIN imports i ON i.id = b.import_id WHERE b.employee_id = e.id AND i.hotel = $1)
             OR EXISTS (SELECT 1 FROM employee_vacation_option o WHERE o.employee = e.employee_key AND o.hotel = $1)
             OR EXISTS (SELECT 1 FROM manual_entries m WHERE m.employee = e.employee_key AND m.hotel = $1)
          ORDER BY name
        `;
            const r = await pool.query(q, [hotelName]);
            console.log(`Count: ${r.rowCount}`);
            if (r.rowCount > 0 && r.rowCount < 10) {
                console.log("Sample:", r.rows.map(x => x.name));
            }
        }

    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        await pool.end();
    }
}

run();
