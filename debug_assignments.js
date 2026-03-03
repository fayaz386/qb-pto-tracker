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
      SELECT employee, COUNT(DISTINCT hotel) as c, array_agg(hotel) as hotels
      FROM employee_vacation_option
      GROUP BY employee
      HAVING COUNT(DISTINCT hotel) > 1
    `;
        const r = await pool.query(q);
        console.log(`Found ${r.rowCount} employees assigned to > 1 hotel.`);
        r.rows.forEach(row => {
            console.log(`${row.employee}: ${row.hotels.join(", ")}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
