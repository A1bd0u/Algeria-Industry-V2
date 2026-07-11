const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductDetail.tsx', 'utf8');

const target = `                </div>
              )}
            </div>
            </div>
        </div>
      </div>
          {/* Report Modal */}`;

const replace = `                </div>
              )}
            </div>
            </div>
        </div>

        {/* Similar Products */}
        {similarProducts && similarProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-black text-primary mb-8 uppercase tracking-tight">Produits Similaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((p, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col group cursor-pointer" onClick={() => {
                  navigate(\`/product/\${p.id}\`);
                  window.scrollTo(0, 0);
                }}>
                  <div className="aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden relative">
                    <img src={p.file_url} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{p.companyName}</p>
                  <h3 className="text-lg font-bold text-primary leading-tight mb-2 flex-1">{p.name}</h3>
                  <p className="text-xl font-black text-secondary">{formatPrice(typeof p.price === 'string' ? parseFloat(p.price.replace(/[^0-9.]/g, '') || '0') : (p.price || 850000))}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
          {/* Report Modal */}`;

code = code.replace(/(\s*){\/\* Report Modal \*\/}/, `
        {/* Similar Products */}
        {similarProducts && similarProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-black text-primary mb-8 uppercase tracking-tight">Produits Similaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((p, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col group cursor-pointer" onClick={() => {
                  navigate(\`/product/\${p.id}\`);
                  window.scrollTo(0, 0);
                }}>
                  <div className="aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden relative">
                    <img src={p.file_url} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{p.companyName}</p>
                  <h3 className="text-lg font-bold text-primary leading-tight mb-2 flex-1">{p.name}</h3>
                  <p className="text-xl font-black text-secondary">{formatPrice(typeof p.price === 'string' ? parseFloat(p.price.replace(/[^0-9.]/g, '') || '0') : (p.price || 850000))}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
          {/* Report Modal */}`);

fs.writeFileSync('src/pages/ProductDetail.tsx', code);
