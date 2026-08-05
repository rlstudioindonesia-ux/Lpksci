const https = require('https');

function getPermutations(template) {
  let results = [''];
  for (const char of template) {
    let options = [char];
    if (char === 'I' || char === '1' || char === 'l') {
      options = ['I', '1', 'l'];
    } else if (char === '0' || char === 'O') {
      options = ['0', 'O'];
    }
    
    const nextResults = [];
    for (const prefix of results) {
      for (const opt of options) {
        nextResults.push(prefix + opt);
      }
    }
    results = nextResults;
  }
  return results;
}

const allKeys = getPermutations("AIzaSyAz--x9Bg2T_wgx4KblpiLprErYPI106kw");
console.log("Total permutations:", allKeys.length);

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
        try {
            const parsed = JSON.parse(body);
            resolve({ key, error: parsed.error ? parsed.error.message : 'OK' });
        } catch(e) {
            resolve({ key, error: 'JSON_ERROR' });
        }
      });
    });
    req.write(data);
    req.end();
  });
}

// limit concurrency
async function run() {
  let i = 0;
  const BATCH_SIZE = 50;
  while (i < allKeys.length) {
    const batch = allKeys.slice(i, i + BATCH_SIZE);
    const promises = batch.map(k => testKey(k).then(res => {
      if (!res.error.includes("API key not valid")) {
        console.log("VALID KEY FOUND:", k, res.error);
        process.exit(0);
      }
    }));
    await Promise.all(promises);
    i += BATCH_SIZE;
  }
  console.log("No valid key found.");
}
run();
