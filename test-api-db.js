const http = require('http');

async function testDB() {
  return new Promise((resolve, reject) => {
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

    const loginReq = http.request(loginOptions, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const responseData = JSON.parse(body);
          console.log('Login Response status:', res.statusCode);
          console.log('Login Response data:', JSON.stringify(responseData, null, 2));

          if (res.statusCode === 200) {
            // Now call db API
            const dbData = JSON.stringify({
              table: 'leads',
              operation: 'select',
              select: 'id, full_name, email, status, created_at',
              order: { column: 'created_at', ascending: false },
              limit: 5
            });

            const dbOptions = {
              hostname: 'localhost',
              port: 3000,
              path: '/api/db',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': dbData.length,
                'Cookie': res.headers['set-cookie'] ? res.headers['set-cookie'].join('; ') : ''
              }
            };

            const dbReq = http.request(dbOptions, (dbRes) => {
              let dbBody = '';

              dbRes.on('data', (chunk) => {
                dbBody += chunk;
              });

              dbRes.on('end', () => {
                try {
                  const dbResponseData = JSON.parse(dbBody);
                  console.log('DB Response status:', dbRes.statusCode);
                  console.log('DB Response data:', JSON.stringify(dbResponseData, null, 2));

                  // Now test /api/auth/me
                  const meOptions = {
                    hostname: 'localhost',
                    port: 3000,
                    path: '/api/auth/me',
                    method: 'GET',
                    headers: {
                      'Cookie': res.headers['set-cookie'] ? res.headers['set-cookie'].join('; ') : ''
                    }
                  };

                  const meReq = http.request(meOptions, (meRes) => {
                    let meBody = '';

                    meRes.on('data', (chunk) => {
                      meBody += chunk;
                    });

                    meRes.on('end', () => {
                      try {
                        const meResponseData = JSON.parse(meBody);
                        console.log('ME Response status:', meRes.statusCode);
                        console.log('ME Response data:', JSON.stringify(meResponseData, null, 2));
                        resolve(meResponseData);
                      } catch (error) {
                        console.error('ME Parse error:', error);
                        reject(error);
                      }
                    });
                  });

                  meReq.on('error', (error) => {
                    console.error('ME Request error:', error);
                    reject(error);
                  });

                  meReq.end();
                } catch (error) {
                  console.error('DB Parse error:', error);
                  reject(error);
                }
              });
            });

            dbReq.on('error', (error) => {
              console.error('DB Request error:', error);
              reject(error);
            });

            dbReq.write(dbData);
            dbReq.end();
          } else {
            reject(new Error('Login failed'));
          }
        } catch (error) {
          console.error('Login Parse error:', error);
          reject(error);
        }
      });
    });

    loginReq.on('error', (error) => {
      console.error('Login Request error:', error);
      reject(error);
    });

    loginReq.write(loginData);
    loginReq.end();
  });
}

testDB().then(() => {
  console.log('Test completed');
}).catch((error) => {
  console.error('Test failed:', error);
});