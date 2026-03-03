const http = require('http');

const hotel = "Holiday Inn & Suites -2565 Argentia";
const url = `http://localhost:8085/api/reports/data?hotel=${encodeURIComponent(hotel)}&type=details&year=`;

console.log("Fetching DETAILS report:", url);

http.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("Status:", res.statusCode);
        try {
            const json = JSON.parse(data);
            if (json.ok) {
                console.log("Rows count:", json.rows ? json.rows.length : 0);
                if (json.rows && json.rows.length > 0) {
                    console.log("First row sample:", json.rows[0]);
                }
            } else {
                console.log("API returned error:", json.error);
            }
        } catch (e) {
            console.log("JSON Parse Error:", e.message);
            console.log("Raw Body:", data.substring(0, 500));
        }
    });
}).on('error', (e) => {
    console.error("Request Error:", e.message);
});
