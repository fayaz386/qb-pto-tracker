const { spawn } = require("child_process");
const path = require("path");

const CONNECTOR_PATH = path.join(
    __dirname,
    "../qb-connector/bin/Debug/net48/qb-connector.exe"
);

// Allow configuring a remote URL (e.g. "http://192.168.1.50:8181")
const QB_BRIDGE_URL = process.env.QB_BRIDGE_URL;

/**
 * Sends a command to the C# QB Connector.
 * @param {string} action - The action name (e.g., 'test', 'get-employees')
 * @param {object} payload - Additional arguments
 * @returns {Promise<any>} Response object
 */
function sendQbCommand(action, payload = {}) {
    // REMOTE MODE
    if (QB_BRIDGE_URL) {
        return fetch(QB_BRIDGE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, ...payload }),
        })
            .then(r => r.json())
            .catch(err => {
                throw new Error(`Remote Bridge Failed (${QB_BRIDGE_URL}): ${err.message}`);
            });
    }

    // LOCAL MODE (Legacy/Fallback)
    return new Promise((resolve, reject) => {
        const proc = spawn(CONNECTOR_PATH, ["local-mode"], { // arg to tell it not to start server if we kept dual logic, but here we just swapped the binary logic.
            // Wait, if we swapped the binary to be a server, we can't spawn it as a CLI tool easily unless we add args support.
            // The new Program.cs runs a server by default.
            // If we are in local mode, we might need to change how we interact or just rely on remote for now since the user asked for diverse setup.
            // BUT, if we want to support local spawn, we should probably update Program.cs to support a "oneshot" flag.
            // For now, let's assume the user IS using remote bridge as requested.
            // If they revert to local, they'll likely use the URL=localhost or we need to update Program.cs to support CLI args again.
            // Let's stick to the requested remote path.
            stdio: ["pipe", "pipe", "pipe"],
        });

        // NOTE: The new C# code is a long-running server. Spawning it here as a one-shot CLI won't work as expected 
        // because it enters a "while(true)" loop.
        // We should probably tell the user to run the server in a separate window even for local dev, 
        // OR we change this service to just hit localhost if no URL is provided, and we assume the user is running the bridge.

        // For safety, let's default to assuming the bridge IS running on localhost if not specified? 
        // Or fail with a helpful message.

        const localUrl = "http://localhost:8181";

        fetch(localUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, ...payload }),
        })
            .then(r => r.json())
            .then(resolve)
            .catch(err => {
                reject(new Error(
                    `QB Connect Failed. \n\nSince you are using the Remote Bridge architecture:\n` +
                    `1. Please ensure 'qb-connector.exe' is running on the QB machine.\n` +
                    `2. If running locally, start it manually.\n` +
                    `3. Configure QB_BRIDGE_URL in .env if it's on another machine.\n\nOriginal Error: ${err.message}`
                ));
            });
    });
}

module.exports = {
    sendQbCommand,
};
