const XLSX = require("xlsx");
const { stringify } = require("csv-stringify/sync");
const PDFDocument = require("pdfkit");

class ReportService {
    /**
     * Generates an Excel file buffer from data
     * @param {Array<Object>} data - Array of rows
     * @param {Array<string>} columns - Column headers/keys
     * @param {string} sheetName
     */
    static generateExcel(data, columns, sheetName = "Report") {
        // Filter/Order data based on columns if provided
        let rows = data;
        if (columns && columns.length > 0) {
            rows = data.map((row) => {
                const newRow = {};
                columns.forEach((col) => {
                    newRow[col] = row[col];
                });
                return newRow;
            });
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    }

    /**
     * Generates a CSV string/buffer
     */
    static generateCSV(data, columns) {
        return stringify(data, {
            header: true,
            columns: columns,
        });
    }

    /**
     * Generates a PDF buffer
     * @param {Array<Object>} data
     * @param {Array<string>} columns
     * @param {string} title
     */
    static generatePDF(data, columns, title = "Report") {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 20, layout: 'landscape', size: 'A4' }); // Landscape A4
            const buffers = [];

            doc.on("data", (chunk) => buffers.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", (err) => reject(err));

            // Title
            doc.fontSize(14).text(title, { align: "center" });
            doc.moveDown();

            // Table configuration
            const tableTop = 60;
            const rowHeight = 15; // Tighter rows
            let y = tableTop;

            const pageWidth = doc.page.width;
            const margin = 20;
            const usableWidth = pageWidth - (margin * 2);

            doc.fontSize(7); // Smaller font

            // Measure Column Logic (Weighted)
            // Giving more space to 'employee_key', 'address', 'job_title', 'email'
            // Numbers get less.
            const colMap = columns.map(c => {
                const cL = c.toLowerCase();
                let weight = 1;
                if (cL.includes("employee")) weight = 2.5;
                if (cL.includes("address")) weight = 3;
                if (cL.includes("email")) weight = 2.5;
                if (cL.includes("job")) weight = 1.5;
                if (cL.includes("amount") || cL.includes("amt") || cL.includes("hrs") || cL.includes("days") || cL.includes("active")) weight = 0.8;
                return { name: c, weight: weight };
            });

            const totalWeight = colMap.reduce((a, b) => a + b.weight, 0);
            const unitWidth = usableWidth / totalWeight;

            // Draw Header
            let x = margin;
            doc.font('Helvetica-Bold'); // Bold Header
            colMap.forEach((col, i) => {
                const w = col.weight * unitWidth;
                doc.text(String(col.name).replace(/_/g, ' ').toUpperCase(), x, y, {
                    width: w - 2, // padding
                    align: "left",
                    ellipsis: true
                });
                col.x = x; // store x for rows
                col.w = w;
                x += w;
            });
            doc.font('Helvetica'); // Reset font

            // Underline header
            y += 25; // increased to ensure no overlap with wrapped text
            doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
            y += 8; // extra padding before body

            // Underline header
            y += 10;
            doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
            y += 5;

            // Rows
            data.forEach((row) => {
                // Check page break
                if (y + rowHeight > doc.page.height - 20) {
                    doc.addPage();
                    y = 50; // reset y
                }

                colMap.forEach((col) => {
                    let val = row[col.name];
                    if (val === null || val === undefined) val = "";

                    // Simple formatting checks based on field name
                    if (String(col.name).includes("amt") || String(col.name).includes("pay")) {
                        if (!isNaN(parseFloat(val))) val = "$" + parseFloat(val).toFixed(2);
                    } else if (String(col.name).includes("hrs")) {
                        if (!isNaN(parseFloat(val))) val = parseFloat(val).toFixed(2);
                    }

                    doc.text(String(val), col.x, y, {
                        width: col.w - 2,
                        align: "left",
                        ellipsis: true // Prevent crazy wrapping overlap
                    });
                });
                y += rowHeight;
            });

            doc.end();
        });
    }
}

module.exports = ReportService;
