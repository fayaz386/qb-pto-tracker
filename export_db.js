const { exec } = require('child_process');
const fs = require('fs');

console.log("Locating PostgreSQL and creating backup...");

// Common install paths for Postgres
const paths = [
    `"C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe"`,
    `"C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe"`,
    `"C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe"`
];

let found = false;
for (const pg of paths) {
    if (fs.existsSync(pg.replace(/"/g, ''))) {
        found = true;
        const cmd = `set PGPASSWORD=dZUyADu!v%IT&& ${pg} -U postgres -d pto_tracker -f migration_backup.sql`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return;
            }
            console.log("✅ Backup Complete! Saved to: C:\\qb-pto-tracker\\migration_backup.sql");
        });
        break;
    }
}

if (!found) {
    console.error("Could not find PostgreSQL installation folder.");
}
