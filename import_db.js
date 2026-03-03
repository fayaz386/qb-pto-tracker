const { execSync } = require('child_process');
const fs = require('fs');

console.log("Searching for PostgreSQL installation...");

const paths = [
    `"C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe"`,
    `"C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe"`,
    `"C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe"`,
    `"C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe"`,
    `"C:\\Program Files\\PostgreSQL\\14\\bin\\psql.exe"`,
    `"C:\\Program Files\\PostgreSQL\\13\\bin\\psql.exe"`,
    `psql`
];

let success = false;
for (const p of paths) {
    const rawPath = p.replace(/"/g, '');
    if (p === 'psql' || fs.existsSync(rawPath)) {
        console.log(`\nFound PostgreSQL! Attempting data injection using: ${p}`);
        try {
            // Run the psql command to restore the file
            execSync(`set PGPASSWORD=dZUyADu!v%IT&& ${p} -U postgres -d pto_tracker -f migration_backup.sql`, { stdio: 'inherit' });
            console.log("\n✅ Migration successfully injected into database!");
            success = true;
            break;
        } catch (e) {
            console.error(`\n❌ Failed to inject using ${p}`);
        }
    }
}

if (!success) {
    console.error("\nCould not automatically find PostgreSQL to inject data. Please ensure it is installed and running!");
}
