const { Pool } = require('pg');
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "pto_tracker",
    password: "dZUyADu!v%IT",
    port: 5432,
});

async function run() {
    const hotel = "Holiday Inn & Suites -2565 Argentia";
    console.log(`Checking for Hotel: ${hotel}`);

    try {
        // 1. Get Settings
        const sRes = await pool.query("SELECT name, max_allowed FROM settings_types");
        console.log("Settings:");
        let maxSick = 0;
        let maxBereav = 0;
        sRes.rows.forEach(r => {
            console.log(` - ${r.name}: ${r.max_allowed}`);
            if (r.name === 'Sick') maxSick = Number(r.max_allowed);
            if (r.name === 'Bereavement') maxBereav = Number(r.max_allowed);
        });
        console.log(`[DEBUG] Max Sick: ${maxSick}, Max Bereav: ${maxBereav}`);

        // 2. Get Employees Summary
        // Note: The app uses /api/reports/summary which queries 'employees' table.
        // We need to see what sick_hours they have.
        // 2. Get Employees Summary
        // Query correct columns from 'employees' table
        const eRes = await pool.query(`
      SELECT display_name, sick_used_hours, bereavement_used_hours 
      FROM employees 
      WHERE sick_used_hours > 0 OR bereavement_used_hours > 0
    `);

        console.log(`\nEmployees with usage (${eRes.rows.length}):`);
        eRes.rows.forEach(r => {
            const s = Number(r.sick_used_hours || 0);
            const b = Number(r.bereavement_used_hours || 0);
            const sWarn = (maxSick > 0 && s >= maxSick) ? "(!MAX!)" : "";
            const bWarn = (maxBereav > 0 && b >= maxBereav) ? "(!MAX!)" : "";

            console.log(` - ${r.display_name}: Sick ${s} ${sWarn}, Bereav ${b} ${bWarn}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

run();
