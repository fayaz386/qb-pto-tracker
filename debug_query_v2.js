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
    console.log(`Testing V2 Query for: ${hotel}`);

    const q = `
      SELECT e.employee_key AS employee,
             e.sick_used_hours,
             e.bereavement_used_hours,
             e.vacation_hours_available,
             e.vacation_used_hours,
            (
                SELECT json_build_object(
                    'year', i.year,
                    'vacation_hours', NULLIF((row_to_json(b)::jsonb->>'vacation_hours'), '')::numeric,
                    'vacation_amount', NULLIF((row_to_json(b)::jsonb->>'vacation_amount'), '')::numeric
                )
                FROM pto_balances b
                JOIN imports i ON i.id = b.import_id
                WHERE b.employee_id = e.id AND i.hotel = $1
                ORDER BY i.created_at DESC
                LIMIT 1
            ) AS legacy_balances
      FROM employees e
      WHERE 
         -- 1. Explicitly associated with THIS hotel
         EXISTS (SELECT 1 FROM employee_vacation_option evo WHERE evo.employee = e.employee_key AND evo.hotel = $1)
         OR EXISTS (SELECT 1 FROM manual_entries me WHERE me.employee = e.employee_key AND me.hotel = $1)
         OR EXISTS (SELECT 1 FROM pto_balances b JOIN imports i ON i.id = b.import_id WHERE b.employee_id = e.id AND i.hotel = $1)
         
         -- 2. OR Unassociated (Free Agents from Sync)
         OR (
            NOT EXISTS (SELECT 1 FROM employee_vacation_option evo WHERE evo.employee = e.employee_key)
            AND NOT EXISTS (SELECT 1 FROM manual_entries me WHERE me.employee = e.employee_key)
            AND NOT EXISTS (SELECT 1 FROM pto_balances b WHERE b.employee_id = e.id)
         )
    `;

    try {
        const res = await pool.query(q, [hotel]);
        console.log(`Query returned ${res.rows.length} rows.`);

        // Check specific employee
        const target = "Baljinder Kaur";
        const found = res.rows.find(r => r.employee === target);
        if (found) {
            console.log("Found Baljinder:", found);
        } else {
            console.log("Baljinder NOT found in result set.");
            // Debug Why
            console.log("Checking associations for Baljinder...");
            const empRes = await pool.query("SELECT id, employee_key FROM employees WHERE employee_key = $1", [target]);
            if (empRes.rows.length > 0) {
                const empId = empRes.rows[0].id;
                const evo = await pool.query("SELECT * FROM employee_vacation_option WHERE employee = $1", [target]);
                const me = await pool.query("SELECT * FROM manual_entries WHERE employee = $1", [target]);
                const pto = await pool.query("SELECT * FROM pto_balances WHERE employee_id = $1", [empId]);
                console.log(" - Options:", evo.rows.length);
                console.log(" - Manual Entries:", me.rows.length);
                console.log(" - PTO Balances:", pto.rows.length);
            } else {
                console.log("Baljinder not in employees table? (Impossible per prev check)");
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

run();
