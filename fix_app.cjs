const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

if (!app.includes('ErrorBoundary')) {
  app = app.replace(
    "import PageTransition from './components/PageTransition';",
    "import PageTransition from './components/PageTransition';\nimport ErrorBoundary from './components/ErrorBoundary';"
  );
  app = app.replace(
    "<QueryClientProvider client={queryClient}>",
    "<ErrorBoundary>\n    <QueryClientProvider client={queryClient}>"
  );
  app = app.replace(
    "</QueryClientProvider>",
    "</QueryClientProvider>\n    </ErrorBoundary>"
  );
  fs.writeFileSync('src/App.tsx', app);
}
