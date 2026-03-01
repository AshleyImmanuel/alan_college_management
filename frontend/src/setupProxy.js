const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
    const backendTarget = 'http://localhost:5000';

    app.use('/api', createProxyMiddleware({
        target: backendTarget,
        changeOrigin: true
    }));

    app.use('/uploads', createProxyMiddleware({
        target: backendTarget,
        changeOrigin: true
    }));

    // Chrome DevTools sometimes probes this endpoint on localhost.
    // Returning 204 avoids noisy 404/CSP warnings in development.
    app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
        res.status(204).end();
    });
};
