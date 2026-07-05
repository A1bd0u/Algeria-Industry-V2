const fs = require('fs');
let code = fs.readFileSync('server/middlewares/rateLimiter.ts', 'utf-8');
code = code.replace(/max: 5, \/\/ Limit each IP to 5 requests per/g, 'max: 500, // Limit each IP to 500 requests per');
fs.writeFileSync('server/middlewares/rateLimiter.ts', code);
console.log("Fixed rate limiter");
