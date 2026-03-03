const http = require('http');

const hotel = "Holiday Inn & Suites -2565 Argentia";
const url = `http://127.0.0.1:8085/api/settings/opening-balances?hotel=${encodeURIComponent(hotel)}`;

console.log(`Fetching: ${url}`);

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode !== 200) {
            console.log("Error Response Body:", data);
        } else {
            try {
                const json = JSON.parse(data);
                console.log("JSON OK:", json.ok);
                if (json.rows) console.log("Rows Count:", json.rows.length);
                if (!json.ok) console.log("API Error:", json.error);
                if (json.rows && json.rows.length > 0) console.log("Sample:", JSON.stringify(json.rows[0]));
            } catch (e) {
                console.log("Parse Error:", e.message);
                console.log("Raw Body:", data);
            }
        }
    });
}).on("error", (err) => {
    console.error("Network Error Details:", err);
});
