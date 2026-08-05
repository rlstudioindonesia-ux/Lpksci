const https = require('https');

const variations = [
  "AIzaSyAz--x9Bg2T_wgx4KblpilprErYPI106kw",
  "AIzaSyAz--x9Bg2T_wgx4Kb1pilprErYPI106kw",
  "AIzaSyAz--x9Bg2T_wgx4Kb1piLprErYPl106kw",
  "AIzaSyAz--x9Bg2T_wgx4KblpiLprErYPl106kw",
  "AIzaSyAz--x9Bg2T_wgx4KblpiIprErYPI106kw",
  "AIzaSyAz--x9Bg2T_wgx4KblpiIprErYPl106kw",
  "AIzaSyAz--x9Bg2T_wgx4KblpiLprErYPII06kw",
  "AIzaSyAz--x9Bg2T_wgx4KblpiLprErYP1106kw",
  "AIzaSyAz--x9Bg2T_wgx4KblpiLprErYPl106kw"
];

async function testKey(key) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ returnSecureToken: true });
    const req = https.request({
      hostname: 'identitytoolkit.googleapis.com',
      port: 443,
      path: '/v1/accounts:signUp?key=' + key,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        const parsed = JSON.parse(body);
        resolve({ key, error: parsed.error ? parsed.error.message : 'OK' });
      });
    });
    req.write(data);
    req.end();
  });
}

async function run() {
  for (const k of variations) {
    const res = await testKey(k);
    if (!res.error.includes("API key not valid")) {
      console.log("VALID KEY:", k, res.error);
    }
  }
}
run();
