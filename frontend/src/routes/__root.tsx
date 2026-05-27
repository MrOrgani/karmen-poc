import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import type { RouterContext } from '../router';

function RootLayout() {
  return (
    <div className="min-h-screen bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-karmen-marine focus:px-3 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-karmen-blue"
      >
        Aller au contenu principal
      </a>
      <header className="bg-karmen-blue text-white">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link to="/" className="inline-flex items-baseline gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-sm">
      <span className="text-white font-bold tracking-tight text-xl">KARMEN</span>
    </Link>
        </div>
      </header>
      <main id="main-content" className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({ component: RootLayout });
