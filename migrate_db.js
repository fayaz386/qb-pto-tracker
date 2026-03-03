require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD
});

const DEFAULT_HOTELS = [
    "Holiday Inn & Suites -2565 Argentia",
    "Holiday Inn Express & Suites - 5599 Ambler"
];

async function migrate() {
    try {
        console.log("Applying Migrations...");

        await pool.query(`ALTER TABLE settings_types ADD COLUMN IF NOT EXISTS max_allowed NUMERIC`);
        await pool.query(`ALTER TABLE settings_types ADD COLUMN IF NOT EXISTS min_allowed NUMERIC`);
        await pool.query(`ALTER TABLE settings_types ADD COLUMN IF NOT EXISTS hotel TEXT`);

        if (DEFAULT_HOTELS.length > 0) {
            await pool.query(`UPDATE settings_types SET hotel = $1 WHERE hotel IS NULL`, [DEFAULT_HOTELS[0]]);
        }

        try {
            await pool.query(`ALTER TABLE settings_types DROP CONSTRAINT IF EXISTS settings_types_name_key`);
            await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS settings_types_hotel_name_key ON settings_types (hotel, name)`);
        } catch (e) { console.warn("Constraint update warning:", e.message); }

        // Seed Types
        for (const h of DEFAULT_HOTELS) {
            for (const t of ["Vacation", "Sick", "Bereavement"]) {
                await pool.query(
                    `INSERT INTO settings_types (hotel, name) VALUES ($1, $2) ON CONFLICT (hotel, name) DO NOTHING`,
                    [h, t]
                );
            }
        }

        console.log("Migration Complete.");
    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        await pool.end();
    }
}

migrate();
