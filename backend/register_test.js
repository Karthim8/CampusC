const http = require('http');

async function testRegister() {
    const payload = JSON.stringify({
        name: "Test User",
        email: "karthikeyanspro+2@gmail.com",
        password: "Password123!"
    });

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length
        }
    };

    console.log('Sending registration request...');
    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log('Status:', res.statusCode);
            console.log('Response:', data);
            process.exit(0);
        });
    });

    req.on('error', (err) => {
        console.error('Error:', err.message);
        process.exit(1);
    });

    req.write(payload);
    req.end();
}

testRegister();
