const fs = require('fs');

const fr = JSON.parse(fs.readFileSync('src/locales/fr.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('src/locales/ar.json', 'utf8'));

function getKeys(obj, prefix = '') {
  let keys = [];
  for (let key in obj) {
    if (typeof obj[key] === 'object') {
      keys = keys.concat(getKeys(obj[key], prefix + key + '.'));
    } else {
      keys.push(prefix + key);
    }
  }
  return keys;
}

const frKeys = new Set(getKeys(fr));
const enKeys = new Set(getKeys(en));
const arKeys = new Set(getKeys(ar));

const allKeys = new Set([...frKeys, ...enKeys, ...arKeys]);

let missingInFr = [];
let missingInEn = [];
let missingInAr = [];

allKeys.forEach(key => {
  if (!frKeys.has(key)) missingInFr.push(key);
  if (!enKeys.has(key)) missingInEn.push(key);
  if (!arKeys.has(key)) missingInAr.push(key);
});

console.log('Missing in FR:', missingInFr);
console.log('Missing in EN:', missingInEn);
console.log('Missing in AR:', missingInAr);
