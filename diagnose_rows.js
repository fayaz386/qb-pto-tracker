const { sendQbCommand } = require("./services/qbService");
const { Pool } = require("pg");
require("dotenv").config();

(async () => {
    try {
        console.log("Fetching Vacation Report...");
        const result = await sendQbCommand("get-vacation-report");

        if (result.status === "ok" && result.rows) {
            console.log("--- ROW LABELS FOUND ---");
            result.rows.forEach(r => {
                console.log(`[${r.label}]`);
            });
            console.log("------------------------");

            // Simulation of server.js logic
            const availRow = result.rows.find(r => r.label && r.label.toLowerCase().includes("available") && r.label.toLowerCase().includes("vacation"));
            const usedRow = result.rows.find(r => r.label && (r.label.toLowerCase().includes("vacation hourly") || r.label.toLowerCase().includes("vacation salary")));
            const accruedRow = result.rows.find(r => r.label && r.label.toLowerCase().includes("accrued") && !r.label.toLowerCase().includes("available")); // server.js doesn't have the !available check!

            console.log("MATCHED AVAILABLE:", availRow ? availRow.label : "NONE");
            console.log("MATCHED USED:", usedRow ? usedRow.label : "NONE");
            console.log("MATCHED ACCRUED:", accruedRow ? accruedRow.label : "NONE");

        } else {
            console.log("Error or No Rows:", result);
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
})();
