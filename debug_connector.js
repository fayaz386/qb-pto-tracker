const cp = require('child_process');
console.log("Starting qb-connector for raw output debug...");
cp.exec('.\\qb-connector\\bin\\Debug\\net48\\qb-connector.exe get-employees', { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
    if (err) {
        console.error("Error executing connector:", err);
        return;
    }
    
    try {
        const result = JSON.parse(stdout);
        const chris = result.employees ? result.employees.find(e => e.name && e.name.includes("Chris")) : null;
        console.log("Raw JSON output for Chris:");
        console.log(JSON.stringify(chris, null, 2));
    } catch(e) {
        console.log("Could not parse as JSON. Raw output snippet:");
        console.log(stdout.substring(0, 1500));
        console.log("...");
        console.log(stdout.substring(stdout.length - 1500));
    }
});
