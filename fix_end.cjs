const fs = require('fs');
let lines = fs.readFileSync('src/pages/Products.tsx', 'utf8').split('\n');

while (lines.length > 0 && !lines[lines.length - 1].includes('export default')) {
  lines.pop();
}

// Remove empty lines and the 'export default' itself
while (lines.length > 0 && (!lines[lines.length - 1].trim() || lines[lines.length - 1].includes('export default'))) {
  lines.pop();
}

// Remove closing braces of component
lines.pop(); // };
lines.pop(); // );

// remove </React.Fragment> and closing divs
while (lines.length > 0 && (lines[lines.length - 1].includes('</div>') || lines[lines.length - 1].includes('</React.Fragment>'))) {
  lines.pop();
}

lines.push(`            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-between border-t border-gray-100 pt-8">
                <button 
                  disabled={activePage === 1}
                  onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    p.set('page', String(activePage - 1));
                    setSearchParams(p);
                    window.scrollTo(0, 0);
                  }}
                  className="disabled:opacity-50 flex items-center space-x-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors px-4 py-2 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Précédent</span>
                </button>
                
                <div className="flex space-x-2 overflow-x-auto max-w-[50vw]">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button 
                      key={page}
                      onClick={() => {
                        const p = new URLSearchParams(searchParams);
                        p.set('page', String(page));
                        setSearchParams(p);
                        window.scrollTo(0, 0);
                      }}
                      className={cn(
                        "min-w-[40px] h-10 px-2 rounded-xl text-sm font-bold flex items-center justify-center transition-all",
                        page === activePage 
                          ? "bg-primary text-white shadow-md"
                          : "text-gray-500 hover:bg-gray-50 hover:text-primary"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button 
                  disabled={activePage === totalPages}
                  onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    p.set('page', String(activePage + 1));
                    setSearchParams(p);
                    window.scrollTo(0, 0);
                  }}
                  className="disabled:opacity-50 flex items-center space-x-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors px-4 py-2 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100"
                >
                  <span>Suivant</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
    </React.Fragment>
  );
};

export default Products;`);

fs.writeFileSync('src/pages/Products.tsx', lines.join('\n'));
