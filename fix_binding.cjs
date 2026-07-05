const fs = require('fs');

const fixBinding = (file) => {
    let code = fs.readFileSync(file, 'utf-8');
    code = code.replace(/onSubmit=\{handleSubmit\(\(data\) => onSubmit\(\{\.\.\.data, captchaToken: captchaToken \|\| 'dummy-token'\}\)\)\}/g, 'onSubmit={handleSubmit(onSubmit)}');
    fs.writeFileSync(file, code);
}
fixBinding('src/pages/Login.tsx');
fixBinding('src/pages/Register.tsx');
