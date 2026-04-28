const routes = [];
export function route(path, render) {
    const paramNames = [];
    const patternStr = path.replace(/:(\w+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
    });
    routes.push({ pattern: new RegExp(`^${patternStr}\\/?$`), paramNames, render });
}
export function navigate(path, replace = false) {
    if (replace) {
        history.replaceState(null, '', path);
    }
    else {
        history.pushState(null, '', path);
    }
    dispatch();
}
function getAppPath() {
    const full = window.location.pathname;
    const match = /^\/app(.*)$/.exec(full);
    return match ? (match[1] || '/') : '/';
}
async function dispatch() {
    const path = getAppPath();
    for (const r of routes) {
        const m = r.pattern.exec(path);
        if (!m)
            continue;
        const params = {};
        r.paramNames.forEach((name, i) => { params[name] = m[i + 1] ?? ''; });
        await r.render(params);
        return;
    }
    // 404 fallback → redirect home
    navigate('/app', true);
}
export function initRouter() {
    window.addEventListener('popstate', () => dispatch());
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (!target)
            return;
        const href = target.getAttribute('href');
        if (!href || !href.startsWith('/app'))
            return;
        e.preventDefault();
        navigate(href);
    });
    dispatch();
}
