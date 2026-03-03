const net = require('net');

const client = new net.Socket();
const PORT = 8181;

client.connect(PORT, 'localhost', () => {
    console.log('Connected to QB Connector...');

    const body = JSON.stringify({ action: 'get-vacation-report' });
    const request = `POST / HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;

    client.write(request);
});

let buffer = '';
client.on('data', (data) => {
    buffer += data.toString();
    console.log(`Received chunk (${data.length} bytes)...`);
});

client.on('end', () => {
    console.log('Response stream ended.');
    try {
        // Strip headers
        const idx = buffer.indexOf('\r\n\r\n');
        if (idx !== -1) {
            const json = buffer.substring(idx + 4);
            const parsed = JSON.parse(json);
            console.log('--- REPORT JSON ---');
            // console.log(JSON.stringify(parsed, null, 2).substring(0, 10000));

            // Traverse for Vacation 
            const findVac = (node, path = '') => {
                if (!node) return;
                if (Array.isArray(node)) {
                    node.forEach((n, i) => findVac(n, `${path}[${i}]`));
                } else if (typeof node === 'object') {
                    // Check if this node looks like a row
                    const txt = JSON.stringify(node).toLowerCase();
                    if (txt.includes('vacation')) {
                        console.log(`MATCH at ${path}:`, node);
                    }
                    Object.keys(node).forEach(k => findVac(node[k], `${path}.${k}`));
                }
            };

            findVac(parsed);

        } else {
            console.log('No headers found?');
            console.log(buffer.substring(0, 500));
        }
    } catch (e) {
        console.log('Error parsing:', e.message);
    }
});

client.on('error', (err) => {
    console.error('Connection error:', err.message);
});
