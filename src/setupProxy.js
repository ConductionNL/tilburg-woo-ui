const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Get target URL from environment (fallback to localhost:8080)
  const targetUrl = process.env.API_TARGET_URL || 'http://localhost:8080';
  
  // Proxy OpenConnector API requests (for hot reload development)
  app.use(
    '/api/openconnector',
    createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/api/openconnector': '/index.php/apps/openconnector/api',
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Webpack proxy - OpenConnector:', req.method, req.url, '→', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Webpack proxy response:', proxyRes.statusCode, req.url);
      },
      logLevel: 'debug',
    })
  );

  // Proxy Nextcloud app API requests (adds index.php automatically)
  app.use(
    '/api/apps',
    createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/api/apps': '/index.php/apps',  // Add index.php for Nextcloud apps
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Webpack proxy - Apps:', req.method, req.url, '→', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Webpack proxy response:', proxyRes.statusCode, req.url);
      },
      logLevel: 'debug',
    })
  );

  // Proxy all other API requests to /api/ (catch-all)
  app.use(
    '/api',
    createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/api': '',  // Remove /api prefix, forward directly to root
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Webpack proxy - API:', req.method, req.url, '→', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Webpack proxy response:', proxyRes.statusCode, req.url);
      },
      logLevel: 'debug',
    })
  );
}; 
