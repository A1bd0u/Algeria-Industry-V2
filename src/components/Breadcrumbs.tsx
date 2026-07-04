import { ChevronRight, Home } from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Don't show breadcrumbs on Home
  if (pathnames.length === 0) return null;

  // Don't show on Extranet (it has its own navigation)
  if (location.pathname.startsWith('/extranet')) return null;

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <nav className="flex items-center space-x-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          <Link 
            to="/" 
            className="text-gray-400 hover:text-secondary transition-colors p-1"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
          
          {pathnames.map((value, index) => {
            const last = index === pathnames.length - 1;
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            const label = value
              .replace(/-/g, ' ')
              .replace(/^\w/, (c) => c.toUpperCase());

            return (
              <React.Fragment key={to}>
                <ChevronRight className="h-3 w-3 text-gray-300 flex-shrink-0" />
                {last ? (
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary px-1">
                    {label}
                  </span>
                ) : (
                  <Link
                    to={to}
                    className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-secondary px-1 transition-colors"
                  >
                    {label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Breadcrumbs;
