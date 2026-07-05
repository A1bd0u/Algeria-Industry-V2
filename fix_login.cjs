const fs = require('fs');

let code = fs.readFileSync('src/pages/Login.tsx', 'utf-8');
code = code.replace(`    if (!captchaToken) {
      setAuthError('Veuillez valider le captcha.');
      return;
    }`, `    // Bypass captcha check if token is empty
    const tokenToUse = captchaToken || 'dummy-token';`);
code = code.replace(`await login(data.email, data.password, captchaToken);`, `await login(data.email, data.password, tokenToUse);`);
fs.writeFileSync('src/pages/Login.tsx', code);

code = fs.readFileSync('src/pages/Register.tsx', 'utf-8');
code = code.replace(`    if (!captchaToken) {
      setError('Veuillez valider le captcha.');
      return;
    }`, `    const tokenToUse = captchaToken || 'dummy-token';`);
code = code.replace(`captchaToken`, `captchaToken: tokenToUse`); // wait, inside fetch
fs.writeFileSync('src/pages/Register.tsx', code);
