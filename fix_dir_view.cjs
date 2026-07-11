const fs = require('fs');
let dir = fs.readFileSync('src/pages/Directory.tsx', 'utf8');

dir = dir.replace(
  '} : error ? (\\s+)<div className="bg-red-50 text-red-500 p-8 border border-red-100 font-bold max-w-md float-left">(\\s+)\\{error\\}(\\s+)</div>',
  '} : isError ? (\\1<div className="bg-red-50 p-8 border border-red-100 max-w-md float-left text-center">\\2<AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />\\2<h3 className="text-red-700 font-bold mb-2">{t(\'common.error\')}</h3>\\2<p className="text-red-500 mb-4">{t(\'common.error_desc\')}</p>\\2<button onClick={() => refetch()} className="btn-primary py-2 px-4 flex items-center justify-center space-x-2 mx-auto"><RefreshCw className="w-4 h-4" /><span>{t(\'common.retry\')}</span></button>\\3</div>'
);

dir = dir.replace(
  '<div className="bg-red-50 text-red-500 p-8 border border-red-100 font-bold max-w-md float-left">\n                {error}\n              </div>',
  '<div className="bg-red-50 p-8 border border-red-100 max-w-md float-left text-center flex flex-col items-center justify-center">\n                <AlertTriangle className="w-8 h-8 text-red-500 mb-4" />\n                <h3 className="text-red-700 font-bold mb-2">Une erreur s\'est produite</h3>\n                <p className="text-red-500 mb-4 text-sm">Impossible de charger les données.</p>\n                <button onClick={() => refetch()} className="btn-primary py-2 px-4 flex items-center justify-center space-x-2"><RefreshCw className="w-4 h-4" /><span>Réessayer</span></button>\n              </div>'
);

fs.writeFileSync('src/pages/Directory.tsx', dir);
