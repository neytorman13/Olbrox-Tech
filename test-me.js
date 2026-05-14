const http = require('http');

async function testMe(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'Cookie': `OLBROX_SESSION=${token}`
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
          console.log('Me endpoint status:', res.statusCode);
          console.log('Me endpoint data:', JSON.stringify(responseData, null, 2));
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

    req.end();
  });
}

async function testLoginAndMe() {
  // First login
  const loginData = JSON.stringify({
    email: 'admin@olbrox.tech',
    password: 'Admin@123456'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(loginOptions, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const responseData = JSON.parse(body);
          console.log('Login successful, token:', responseData.data?.session?.token);

          // Now test /me endpoint
          testMe(responseData.data.session.token).then(resolve).catch(reject);
        } catch (error) {
          console.error('Login parse error:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Login request error:', error);
      reject(error);
    });

    req.write(loginData);
    req.end();
  });
}

testLoginAndMe().catch(console.error);