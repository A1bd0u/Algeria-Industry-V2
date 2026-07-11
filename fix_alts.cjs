const fs = require('fs');
const files = [
  'src/pages/Blog.tsx',
  'src/pages/Catalogues.tsx',
  'src/pages/Home.tsx',
  'src/pages/Events.tsx',
  'src/pages/BlogDetail.tsx',
  'src/pages/Products.tsx',
  'src/components/HeroSlider.tsx',
  'src/components/AdSpace.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Basic replacement for <img ... without alt
    content = content.replace(/<img([^>]+?)>/g, (match, p1) => {
      if (!p1.includes('alt=')) {
        return `<img${p1} alt="Image" />`;
      }
      return match;
    });
    fs.writeFileSync(file, content);
  }
});
