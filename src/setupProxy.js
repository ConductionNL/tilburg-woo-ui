const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Get target URL and hostname from environment
  const targetUrl = process.env.API_TARGET_URL || 'http://localhost:8080';
  const targetHost = process.env.NEXTCLOUD_HOST || 'localhost';
  
  // Proxy OpenConnector API requests (for hot reload development)
  app.use(
    '/api/openconnector',
    createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      headers: {
        'Host': targetHost
      },
      pathRewrite: {
        '^/api/openconnector': '/index.php/apps/openconnector/api',
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
      headers: {
        'Host': targetHost
      },
      pathRewrite: {
        '^/api/apps': '/index.php/apps',  // Add index.php for Nextcloud apps
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
      headers: {
        'Host': targetHost
      },
      pathRewrite: {
        '^/api': '',  // Remove /api prefix, forward directly to root
      },
      logLevel: 'debug',
    })
  );
}; 
