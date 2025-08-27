const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Get target hostname and URL from environment variables
  const targetHost = process.env.NEXTCLOUD_HOST || 'nextcloud.local';
  const targetUrl = process.env.NGINX_NEXTCLOUD_UPSTREAM || `https://${targetHost}`;
  const targetSecure = targetUrl.startsWith('https://');

  console.log('🔧 Webpack proxy configuration:');
  console.log('   Target Host:', targetHost);
  console.log('   Target URL:', targetUrl);
  console.log('   Target Secure:', targetSecure);

  // Proxy OpenConnector API requests (for hot reload development)
  app.use(
    '/api/openconnector',
    createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      secure: targetSecure,
      headers: {
        Host: targetHost,
      },
      pathRewrite: {
        '^/api/openconnector': '/index.php/apps/openconnector/api',
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(
          '🔄 Webpack proxy - OpenConnector:',
          req.method,
          req.url,
          '→',
          proxyReq.getHeader('host') + proxyReq.path
        );
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
      secure: targetSecure,
      headers: {
        Host: targetHost,
      },
      pathRewrite: {
        '^/api/apps': '/index.php/apps',
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(
          '🔄 Webpack proxy - Apps:',
          req.method,
          req.url,
          '→',
          proxyReq.getHeader('host') + proxyReq.path
        );
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
      secure: targetSecure,
      headers: {
        Host: targetHost,
      },
      pathRewrite: {
        '^/api': '',
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(
          '🔄 Webpack proxy - API:',
          req.method,
          req.url,
          '→',
          proxyReq.getHeader('host') + proxyReq.path
        );
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Webpack proxy response:', proxyRes.statusCode, req.url);
      },
      logLevel: 'debug',
    })
  );
};
