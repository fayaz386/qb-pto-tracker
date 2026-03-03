const { sendQbCommand } = require("./services/qbService");

(async () => {
    try {
        console.log("Fetching Vacation Report...");
        const result = await sendQbCommand("get-vacation-report");

        if (result.status === "ok") {
            console.log("--- DEBUGGING SICK ROW ---");

            // Check Current Year Rows first
            const rows = result.rows_current || [];

            const sickRow = rows.find(r => r.label && r.label.toLowerCase().includes("sick hourly"));

            if (sickRow) {
                console.log("FOUND ROW: " + sickRow.label);
                console.log("KEYS:", Object.keys(sickRow.values));
                // Print values for Baljinder (fuzzy match)
                const balKey = Object.keys(sickRow.values).find(k => k.toLowerCase().includes("baljinder"));
                if (balKey) {
                    console.log("BALJINDER ENTRIES:");
                    Object.keys(sickRow.values).forEach(k => {
                        if (k.toLowerCase().includes("baljinder")) {
                            console.log(`${k}: ${sickRow.values[k]}`);
                        }
                    });
                } else {
                    console.log("Baljinder NOT FOUND in keys.");
                }
            } else {
                console.log("Sick Hourly Row NOT FOUND.");
                console.log("Yielding all row labels:");
                rows.forEach(r => console.log(r.label));
            }

        } else {
            console.log("Error or No Rows:", result);
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
})();
