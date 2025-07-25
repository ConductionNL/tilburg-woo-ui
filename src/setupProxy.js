const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Get target hostname from environment (fallback to nextcloud.local)
  const targetHost = process.env.NEXTCLOUD_HOST || 'nextcloud.local';
  
  // Proxy OpenConnector API requests (for hot reload development)
  app.use(
    '/api/openconnector',
    createProxyMiddleware({
      target: 'http://host.docker.internal:80',
      changeOrigin: true,
      headers: {
        'Host': targetHost  // Use configurable hostname
      },
      pathRewrite: {
        '^/api/openconnector': '/index.php/apps/openconnector/api',
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Webpack proxy - OpenConnector:', req.method, req.url, '→', proxyReq.getHeader('host') + proxyReq.path);
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
      target: 'http://host.docker.internal:80',
      changeOrigin: true,
      headers: {
        'Host': targetHost  // Use configurable hostname
      },
      pathRewrite: {
        '^/api/apps': '/index.php/apps',  // Add index.php for Nextcloud apps
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Webpack proxy - Apps:', req.method, req.url, '→', proxyReq.getHeader('host') + proxyReq.path);
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
      target: 'http://host.docker.internal:80',
      changeOrigin: true,
      headers: {
        'Host': targetHost  // Use configurable hostname
      },
      pathRewrite: {
        '^/api': '',  // Remove /api prefix, forward directly to root
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Webpack proxy - API:', req.method, req.url, '→', proxyReq.getHeader('host') + proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Webpack proxy response:', proxyRes.statusCode, req.url);
      },
      logLevel: 'debug',
    })
  );
}; 
