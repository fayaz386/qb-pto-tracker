const fs = require('fs');
const { parse } = require('csv-parse');

const filename = "12-24-2025 12-52pm ARG payroll summary.CSV";
const csvText = fs.readFileSync(filename, 'utf8');

function normalizeEmployeeKey(v) {
    if (v === undefined || v === null) return "";
    return String(v).trim().replace(/^"|"$/g, "").trim();
}

const rows = [];
parse(
    csvText,
    { bom: true, relax_column_count: true, skip_empty_lines: true, trim: true, columns: false },
    (err, output) => {
        if (err) {
            console.error(err);
            return;
        }
        output.forEach((r) => rows.push(r));
        runLogic(rows);
    }
);

function runLogic(rows) {
    console.log("Total rows:", rows.length);

    const header = rows[0].map((c) => normalizeEmployeeKey(c));
    const employees = [];
    let empCounter = 0;

    for (let i = 1; i < header.length; i++) {
        const name = header[i];
        if (!name) continue;
        if (name.toUpperCase() === "TOTAL") break;

        const dataIndex = 1 + (empCounter * 3);
        employees.push({
            employeeKey: name,
            dataIndex: dataIndex
        });
        console.log(`Found Employee: ${name} (HeaderCol: ${i}, DataIdx: ${dataIndex})`);
        empCounter++;
    }

    const findRowByLabel = (label) => {
        const target = String(label).trim().toLowerCase();
        return rows.find((r) => String(r[0] || "").trim().toLowerCase().startsWith(target));
    };

    const sickRow = findRowByLabel("Sick Hourly Rate");
    if (!sickRow) {
        console.error("Sick Row NOT FOUND");
        return;
    }
    console.log("Sick Row Found:", sickRow.slice(0, 10));

    employees.slice(0, 3).forEach(emp => {
        const colIdx = emp.dataIndex;
        const sickHoursVal = sickRow[colIdx];
        const sickAmountVal = sickRow[colIdx + 2];
        console.log(`Emp: ${emp.employeeKey} -> Hours[${colIdx}]: "${sickHoursVal}", Amount[${colIdx + 2}]: "${sickAmountVal}"`);
    });
}
