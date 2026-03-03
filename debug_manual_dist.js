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
        const q = `
      SELECT hotel, COUNT(*) as c, array_agg(employee) as emps
      FROM manual_entries
      GROUP BY hotel
    `;
        const r = await pool.query(q);
        console.log("--- Manual Entries Summary ---");
        r.rows.forEach(row => {
            console.log(`Hotel: "${row.hotel}" | Count: ${row.c}`);
            console.log(` - Sample Emps: ${row.emps.slice(0, 3).join(", ")}`);
        });

        const fullDetails = await pool.query(`SELECT hotel, employee FROM manual_entries ORDER BY hotel, employee`);

        // Check intersection
        const map = {};
        fullDetails.rows.forEach(r => {
            if (!map[r.employee]) map[r.employee] = new Set();
            map[r.employee].add(r.hotel);
        });

        console.log("\n--- Cross-Hotel Employees? ---");
        let found = false;
        for (const [emp, hotels] of Object.entries(map)) {
            if (hotels.size > 1) {
                console.log(`${emp} is in: ${[...hotels].join(" AND ")}`);
                found = true;
            }
        }
        if (!found) console.log("No employees found in multiple hotels.");

    } catch (e) { console.error(e); } finally { pool.end(); }
}
run();
