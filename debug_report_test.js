const http = require('http');

const hotel = "Holiday Inn & Suites -2565 Argentia"; // Hardcoded from user screenshot
const url = `http://localhost:8085/api/reports/data?hotel=${encodeURIComponent(hotel)}&type=summary&year=`;

console.log("Fetching:", url);

http.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("Status:", res.statusCode);
        console.log("Headers:", res.headers);
        console.log("Data Preview:", data.substring(0, 500));
        try {
            const json = JSON.parse(data);
            console.log("JSON OK. Rows:", json.rows ? json.rows.length : 0);
        } catch (e) {
            console.log("JSON Parse Error:", e.message);
        }
    });
}).on('error', (e) => {
    console.error("Request Error:", e.message);
});
