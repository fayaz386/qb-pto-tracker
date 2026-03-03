const net = require('net');

function sendQbCommand(command, payload = {}) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let responseData = "";

        client.connect(8181, '127.0.0.1', () => {
            console.log(`Sending command: ${command}`);
            const body = JSON.stringify({ action: command, ...payload });
            const request =
                `POST / HTTP/1.1\r\n` +
                `Host: 127.0.0.1:8181\r\n` +
                `Content-Type: application/json\r\n` +
                `Content-Length: ${Buffer.byteLength(body)}\r\n` +
                `\r\n` +
                body;
            client.write(request);
        });

        client.on('data', (data) => {
            console.log(`Received chunk (${data.length} bytes)...`);
            responseData += data.toString();
        });

        client.on('end', () => {
            try {
                // Strip HTTP headers
                const parts = responseData.split("\r\n\r\n");
                const body = parts.length > 1 ? parts[1] : parts[0];

                if (!body.trim()) {
                    resolve({});
                    return;
                }

                const json = JSON.parse(body);
                resolve(json);
            } catch (e) {
                console.error("Parse Error. Raw Data length: " + responseData.length);
                console.error("Raw start: " + responseData.substring(0, 100));
                reject(e);
            }
        });

        client.on('error', (err) => reject(err));
    });
}

(async () => {
    try {
        console.log("Fetching employees from QB Connector...");
        const data = await sendQbCommand("get-employees");

        if (data.status === "ok" && data.employees) {
            // Find Baljinder
            const emp = data.employees.find(e => e.name.toLowerCase().includes("baljinder"));
            if (emp) {
                console.log("FOUND Baljinder:");
                console.log(JSON.stringify(emp, null, 2));
            } else {
                console.log("Baljinder not found. Showing first 2 employees:");
                console.log(JSON.stringify(data.employees.slice(0, 2), null, 2));
            }
        } else {
            console.log("Error or no employees:", data);
        }

    } catch (e) {
        console.error(e);
    }
})();
