const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT,
});

async function dump() {
    try {
        const tables = ['employees', 'pto_balances', 'pto_requests', 'imports'];
        for (const t of tables) {
            console.log(`\nCREATE TABLE IF NOT EXISTS ${t} (`);
            const res = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [t]);
            res.rows.forEach(r => console.log(`  ${r.column_name} ${r.data_type},`));
            console.log(`  PRIMARY KEY (id) -- check this\n);`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

dump();
