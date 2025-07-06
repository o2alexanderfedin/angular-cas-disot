const http = require('http');

// Configuration to set
const corsConfig = {
  "Access-Control-Allow-Origin": [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
    "http://localhost:*",
    "http://127.0.0.1:*"
  ],
  "Access-Control-Allow-Methods": [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "OPTIONS"
  ],
  "Access-Control-Allow-Headers": [
    "Authorization",
    "Content-Type",
    "X-Requested-With"
  ],
  "Access-Control-Allow-Credentials": [
    "true"
  ]
};

// Update each header
Object.entries(corsConfig).forEach(([key, value]) => {
  const data = JSON.stringify(value);
  const options = {
    hostname: '127.0.0.1',
    port: 5001,
    path: `/api/v0/config?arg=API.HTTPHeaders.${key}&json=true`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Set ${key}: ${res.statusCode}`);
  });

  req.on('error', (error) => {
    console.error(`Error setting ${key}:`, error.message);
  });

  req.write(data);
  req.end();
});

console.log('\nCORS configuration updated!');
console.log('Please restart IPFS Desktop for changes to take effect.');