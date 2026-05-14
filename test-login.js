const http = require('http');

async function testLogin() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: 'admin@olbrox.tech',
      password: 'Admin@123456'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const responseData = JSON.parse(body);
          console.log('Response status:', res.statusCode);
          console.log('Response data:', JSON.stringify(responseData, null, 2));
          resolve(responseData);
        } catch (error) {
          console.error('Parse error:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

testLogin().catch(console.error);