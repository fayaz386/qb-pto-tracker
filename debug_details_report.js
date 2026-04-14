const https = require('https');

https.get('https://localhost:8085/api/employee-details?hotel=Holiday%20Inn%20%26%20Suites%20-2565%20Argentia&employee=Chris-Solo%20Capuy', { rejectUnauthorized: false }, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});
