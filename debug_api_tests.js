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
        console.log("Testing Settings Query (Simulating /api/settings/all)...");
        const hotels = await pool.query("SELECT * FROM settings_hotels ORDER BY name");
        console.log("Hotels:", hotels.rows.length);
        const years = await pool.query("SELECT * FROM settings_years ORDER BY year DESC");
        console.log("Years:", years.rows.length);
        const types = await pool.query("SELECT * FROM settings_types ORDER BY name");
        console.log("Types:", types.rows.length);

        console.log("\nTesting Insert Hotel...");
        const testHotel = "Test Hotel " + Date.now();
        await pool.query("INSERT INTO settings_hotels (name) VALUES ($1)", [testHotel]);
        console.log("Inserted:", testHotel);

        // Clean up
        await pool.query("DELETE FROM settings_hotels WHERE name = $1", [testHotel]);
        console.log("Deleted test hotel.");

        console.log("\nTesting Types Filter...");
        const h = hotels.rows[0]?.name;
        if (h) {
            const t = await pool.query("SELECT * FROM settings_types WHERE hotel = $1", [h]);
            console.log(`Types for '${h}':`, t.rows.length);
        }

    } catch (err) {
        console.error("API Test Error:", err);
    } finally {
        await pool.end();
    }
}

run();
