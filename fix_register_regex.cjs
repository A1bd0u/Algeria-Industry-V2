const fs = require('fs');
let code = fs.readFileSync('src/pages/Register.tsx', 'utf-8');
code = code.replace(`const [captchaToken: tokenToUse, setCaptchaToken]`, `const [captchaToken, setCaptchaToken]`);
fs.writeFileSync('src/pages/Register.tsx', code);
