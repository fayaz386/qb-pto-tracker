const os = require('os');
const http = require('http');
const URL = require('url').URL;

function getLocalIpForTarget(targetUrl) {
    try {
        const u = new URL(targetUrl);
        const targetHost = u.hostname; // e.g., 192.168.0.48

        // Simple heuristic: if target is IPv4, find local IPv4 in same /24 subnet
        // A robust way is matching subnet masks.
        if (!targetHost.match(/^\d+\.\d+\.\d+\.\d+$/)) return null;

        const targetParts = targetHost.split('.').map(Number);
        const interfaces = os.networkInterfaces();

        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    // Check if in same subnet (assumes standard mask for simplicity, or use iface.netmask)
                    // iface.netmask is e.g. "255.255.255.0"
                    const maskParts = iface.netmask.split('.').map(Number);
                    const localParts = iface.address.split('.').map(Number);

                    let match = true;
                    for (let i = 0; i < 4; i++) {
                        if ((targetParts[i] & maskParts[i]) !== (localParts[i] & maskParts[i])) {
                            match = false;
                            break;
                        }
                    }
                    if (match) {
                        return iface.address;
                    }
                }
            }
        }
    } catch (e) {
        console.error("Error parsing target URL", e);
    }
    return null;
}

const target = "http://192.168.0.48:8181";
const localIp = getLocalIpForTarget(target);
console.log("Target:", target, "=> Local IP to bind:", localIp);
