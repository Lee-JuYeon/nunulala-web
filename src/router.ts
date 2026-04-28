type PageRenderer = (params: Record<string, string>) => Promise<void> | void;

interface Route {
  pattern: RegExp;
  paramNames: string[];
  render: PageRenderer;
}

const routes: Route[] = [];

export function route(path: string, render: PageRenderer): void {
  const paramNames: string[] = [];
  const patternStr = path.replace(/:(\w+)/g, (_, name: string) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  routes.push({ pattern: new RegExp(`^${patternStr}\\/?$`), paramNames, render });
}

export function navigate(path: string, replace = false): void {
  if (replace) {
    history.replaceState(null, '', path);
  } else {
    history.pushState(null, '', path);
  }
  dispatch();
}

function getAppPath(): string {
  const full = window.location.pathname;
  const match = /^\/app(.*)$/.exec(full);
  return match ? (match[1] || '/') : '/';
}

async function dispatch(): Promise<void> {
  const path = getAppPath();
  for (const r of routes) {
    const m = r.pattern.exec(path);
    if (!m) continue;
    const params: Record<string, string> = {};
    r.paramNames.forEach((name, i) => { params[name] = m[i + 1] ?? ''; });
    await r.render(params);
    return;
  }
  // 404 fallback → redirect home
  navigate('/app', true);
}

export function initRouter(): void {
  window.addEventListener('popstate', () => dispatch());

  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('a');
    if (!target) return;
    const href = target.getAttribute('href');
    if (!href || !href.startsWith('/app')) return;
    e.preventDefault();
    navigate(href);
  });

  dispatch();
}
