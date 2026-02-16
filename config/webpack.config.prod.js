'use strict';

const dotenv = require('dotenv');
const fs = require('fs'); // to check if the file exists
const getClientEnvironment = require('./env');
const path = require('path');
const paths = require('./paths');
const webpack = require('webpack');
const zlib = require('zlib');

const CopyPlugin = require('copy-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const PreloadWebpackPlugin = require('preload-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
// const RollbarSourceMapPlugin = require('rollbar-sourcemap-webpack-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
// const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');

const MinimalClassnameGenerator = require('webpack-minimal-classnames');

const generateMinimalClassname = MinimalClassnameGenerator({
  length: 3,
  excludePatterns: [/ad/i],
});

function resolve(dir) {
  return path.join(__dirname, '..', dir);
}

// Webpack uses `publicPath` to determine where the app is being served from.
// It requires a trailing slash, or the file assets will get an incorrect path.
const publicPath = paths.publicUrl;
// Some apps do not use client-side routing with pushState.
// For these, "homepage" can be set to "." to enable relative asset paths.
const shouldUseRelativeAssetPaths = publicPath === './';
// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = true;
// `publicUrl` is just like `publicPath`, but we will provide it to our app
// as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
// Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
const publicUrl = publicPath.slice(0, -1);
// Get environment variables to inject into our app.
const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

// style files regexes
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

const swSrc = paths.swSrc;

// Generate build version for cache busting
const BUILD_TIMESTAMP = new Date().toISOString();

// Use GitHub CI information if available, otherwise use timestamp
const BUILD_VERSION = process.env.GITHUB_SHA
  ? `${process.env.GITHUB_RUN_NUMBER || 'build'}-${process.env.GITHUB_SHA.substring(
      0,
      7
    )}-${Date.now()}`
  : `${new Date().getFullYear()}.${(new Date().getMonth() + 1)
      .toString()
      .padStart(2, '0')}.${new Date()
      .getDate()
      .toString()
      .padStart(2, '0')}-${Date.now()}`;

// reduce it to a nice object, the same as before
const enrichEnvVariables = (type) => {
  let _env = {
    stringified: {
      'process.env': {
        PUBLIC_URL: '""',
        PUBLIC_PATH: '""',
      },
    },
    raw: {
      PUBLIC_URL: '',
      PUBLIC_PATH: '',
      BUILD_TIMESTAMP: BUILD_TIMESTAMP,
      BUILD_VERSION: BUILD_VERSION,
    },
  };
  const _type = type ? type : 'stringified';

  // Get the ENV variables from the .env file
  const ENV = dotenv.config().parsed || {};

  Object.keys(ENV).reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(ENV[next]);

    _env.raw[next] = ENV[next];
    _env['stringified']['process.env'][next] = JSON.stringify(ENV[next]);

    return prev;
  }, {});

  // Add Piwik Pro variables - always add these so InterpolateHtmlPlugin can replace placeholders
  // Priority: .env file > process.env > empty string
  const piwikVars = ['PIWIK_SRC_URL', 'PIWIK_DATA_LAYER', 'PIWIK_ID'];
  piwikVars.forEach((key) => {
    // If already in ENV (from .env file), it was added above, so skip
    if (!(key in ENV)) {
      // Get value from process.env or default to empty string
      const value = process.env[key] !== undefined ? String(process.env[key]) : '';
      _env.raw[key] = value;
      if (!_env['stringified']['process.env']) {
        _env['stringified']['process.env'] = {};
      }
      _env['stringified']['process.env'][key] = JSON.stringify(value);
    }
    // Ensure key exists in raw even if it was in ENV (to guarantee it's there)
    if (!(key in _env.raw)) {
      _env.raw[key] = ENV[key] || '';
    }
  });

  // Add build info to both raw and stringified
  _env.raw.BUILD_TIMESTAMP = BUILD_TIMESTAMP;
  _env.raw.BUILD_VERSION = BUILD_VERSION;
  _env.stringified['process.env'].BUILD_TIMESTAMP = JSON.stringify(BUILD_TIMESTAMP);
  _env.stringified['process.env'].BUILD_VERSION = JSON.stringify(BUILD_VERSION);

  return _env[_type];
};

// Assert this just to be safe.
// Development builds of React are slow and not intended for production.
if (env.stringified['process.env'].NODE_ENV !== '"production"') {
  throw new Error('Production builds must have NODE_ENV=production.');
}

// Note: defined here because it will be used more than once.
const cssFilename = 'static/css/[name].[contenthash:8].css';

const _env = enrichEnvVariables('stringified');

// ExtractTextPlugin expects the build output to be flat.
// (See https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/27)
// However, our output is structured with css, js and media folders.
// To have this structure working with relative paths, we have to use custom options.
const extractTextPluginOptions = shouldUseRelativeAssetPaths // Making sure that the publicPath goes back to to build folder.
  ? { publicPath: Array(cssFilename.split('/').length).join('../') }
  : {};
// This is the production configuration.
// It compiles slowly and is focused on producing a fast and minimal bundle.
// The development configuration is different and lives in a separate file.
module.exports = function (webpackEnv) {
  // Variable used for enabling profiling in Production
  // passed into alias object. Uses a flag if passed into the build command
  const isEnvProductionProfile = process.argv.includes('--profile');

  // common function to get style loaders
  const getStyleLoaders = (cssOptions, preProcessor) => {
    const loaders = [
      {
        loader: MiniCssExtractPlugin.loader,
        // css is located in `static/css`, use '../../' to locate index.html folder
        // in production `paths.publicUrlOrPath` can be a relative path
        options: paths.publicUrlOrPath.startsWith('.')
          ? { publicPath: '../../' }
          : {},
      },
      {
        loader: require.resolve('css-loader'),
        options: cssOptions,
      },
      {
        // Options for PostCSS as we reference these options twice
        // Adds vendor prefixing based on your specified browser support in
        // package.json
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            // Necessary for external CSS imports to work
            // https://github.com/facebook/create-react-app/issues/2677
            ident: 'postcss',
            config: false,
            plugins: [
              'postcss-flexbugs-fixes',
              [
                'postcss-preset-env',
                {
                  autoprefixer: {
                    flexbox: 'no-2009',
                  },
                  stage: 3,
                },
              ],
              // Adds PostCSS Normalize as the reset css with default options,
              // so that it honors browserslist config in package.json
              // which in turn let's users customize the target behavior as per their needs.
              'postcss-normalize',
            ],
          },
          sourceMap: shouldUseSourceMap,
        },
      },
    ].filter(Boolean);
    if (preProcessor) {
      loaders.push(
        {
          loader: require.resolve('resolve-url-loader'),
          options: {
            sourceMap: shouldUseSourceMap,
            root: paths.appSrc,
          },
        },
        {
          loader: require.resolve(preProcessor),
          options: {
            sourceMap: true,
          },
        }
      );
    }
    return loaders;
  };

  return {
    mode: 'production',
    // Don't attempt to continue if there are any errors.
    bail: true,
    // We generate sourcemaps in production. This is slow but gives good results.
    // You can exclude the *.map files from the build during deployment.
    devtool: 'source-map',
    // In production, we only want to load the polyfills and the app code.
    entry: [require.resolve('./polyfills'), paths.appIndexJs],
    output: {
      // The build folder.
      path: paths.appBuild,
      // Generated JS file names (with nested folders).
      // There will be one main bundle, and one file per asynchronous chunk.
      // We don't currently advertise code splitting but Webpack supports it.
      pathinfo: true,
      filename: 'static/js/[name].[chunkhash:8].js',
      chunkFilename: 'static/js/[name].[chunkhash:8].chunk.js',
      // We inferred the "public path" (such as / or /my-project) from homepage.
      publicPath: publicPath,
    },
    resolve: {
      fallback: {
        path: require.resolve('console-browserify'),
      },
      // This allows you to set a fallback for where Webpack should look for modules.
      // We placed these paths second because we want `node_modules` to "win"
      // if there are any conflicts. This matches Node resolution mechanism.
      // https://github.com/facebookincubator/create-react-app/issues/253
      modules: ['node_modules', paths.appNodeModules].concat(
        // It is guaranteed to exist because we tweak it in `env.js`
        process.env.NODE_PATH.split(path.delimiter).filter(Boolean)
      ),
      // These are the reasonable defaults supported by the Node ecosystem.
      // We also include JSX as a common component filename extension to support
      // some tools, although we do not recommend using it, see:
      // https://github.com/facebookincubator/create-react-app/issues/290
      // `web` extension prefixes have been added for better support
      // for React Native Web.
      extensions: [
        '.web.js',
        '.mjs',
        '.js',
        '.json',
        '.web.jsx',
        '.jsx',
        '.ts',
        '.tsx',
        '.scss',
        '.css',
      ],
      alias: {
        react: 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react-dom': 'preact/compat', // Must be below test-utils
        'react/jsx-runtime': 'preact/jsx-runtime',

        '@src': resolve('src'),

        '@assets': resolve('src/assets'),
        '@fonts': resolve('src/assets/fonts'),
        '@data': resolve('src/assets/data'),

        '@styles': resolve('src/styles'),

        '@atoms': resolve('src/atoms'),
        '@components': resolve('src/components'),
        '@models': resolve('src/models'),
        '@molecules': resolve('src/molecules'),
        '@tabs': resolve('src/tabs'),
        '@pages': resolve('src/pages'),
        '@views': resolve('src/views'),

        '@api': resolve('src/api'),
        '@config': resolve('src/config'),
        '@constants': resolve('src/constants'),
        '@hooks': resolve('src/hooks'),
        '@stores': resolve('src/stores'),
        '@services': resolve('src/services'),
        '@utils': resolve('src/utilities'),
      },
      plugins: [],
    },
    module: {
      strictExportPresence: true,
      rules: [
        // TODO: Disable require.ensure as it's not a standard language feature.
        // We are waiting for https://github.com/facebookincubator/create-react-app/issues/2176.
        // { parser: { requireEnsure: false } },
        {
          // "oneOf" will traverse all following loaders until one will
          // match the requirements. When no loader matches it will fall
          // back to the "file" loader at the end of the loader list.
          oneOf: [
            {
              test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
              include: [paths.appFonts, `${paths.appFonts}/**/`],
              type: 'asset/resource',
              generator: {
                filename: './static/fonts/[hash:13][ext]',
              },
            },
            // "url" loader works like "file" loader except that it embeds assets
            // smaller than specified limit in bytes as data URLs to avoid requests.
            // A missing `test` is equivalent to a match.
            {
              test: [
                /\.bmp$/,
                /\.gif$/,
                /\.jpe?g$/,
                /\.png$/,
                /\.webp$/,
                /\.mp3$/,
                /\.pdf$/,
              ],
              type: 'asset',
              parser: {
                dataUrlCondition: {
                  maxSize: 28000,
                },
              },
              generator: {
                filename: './static/media/[hash:13][ext]',
              },
            },
            {
              test: /\.svg$/,
              use: [
                {
                  loader: require.resolve('@svgr/webpack'),
                  options: {
                    prettier: false,
                    svgo: false,
                    svgoConfig: {
                      plugins: [{ removeViewBox: false }],
                    },
                    titleProp: true,
                    ref: true,
                  },
                },
                {
                  loader: require.resolve('file-loader'),
                  options: {
                    name: 'static/media/[hash:13][ext]',
                  },
                },
              ],
              issuer: {
                and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
              },
            },
            // Process JS with Babel.
            // /\.web?\.?(js|jsx|mjs)$/
            {
              test: /(\.web)?\.(js(x)?|mjs)$/,
              include: paths.appSrc,
              exclude: /node_modules/,
              loader: require.resolve('babel-loader'),
              options: {
                // This is a feature of `babel-loader` for webpack (not Babel itself).
                // It enables caching results in ./node_modules/.cache/babel-loader/
                // directory for faster rebuilds.
                cacheDirectory: true,
              },
            },
            // "postcss" loader applies autoprefixer to our CSS.
            // "css" loader resolves paths in CSS and adds assets as dependencies.
            // "style" loader turns CSS into JS modules that inject <style> tags.
            // In production, we use MiniCSSExtractPlugin to extract that CSS
            // to a file, but in development "style" loader enables hot editing
            // of CSS.
            // By default we support CSS Modules with the extension .module.css
            {
              test: cssRegex,
              exclude: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: false,
                modules: {
                  mode: 'icss',
                },
              }),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
            },
            // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
            // using the extension .module.css
            {
              test: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: false,
                modules: {
                  mode: 'local',
                  getLocalIdent: generateMinimalClassname,
                },
              }),
            },
            // Opt-in support for SASS (using .scss or .sass extensions).
            // By default we support SASS Modules with the
            // extensions .module.scss or .module.sass
            {
              test: sassRegex,
              exclude: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap: false,
                  modules: {
                    mode: 'icss',
                  },
                },
                'sass-loader'
              ),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
            },
            // Adds support for CSS Modules, but using SASS
            // using the extension .module.scss or .module.sass
            {
              test: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap: false,
                  modules: {
                    mode: 'local',
                    getLocalIdent: generateMinimalClassname,
                  },
                },
                'sass-loader'
              ),
            },
            // "file" loader makes sure those assets get served by WebpackDevServer.
            // When you `import` an asset, you get its (virtual) filename.
            // In production, they would get copied to the `build` folder.
            // This loader doesn't use a "test" so it will catch all modules
            // that fall through the other loaders.
            {
              // Exclude `js` files to keep "css" loader working as it injects
              // its runtime that would otherwise be processed through "file" loader.
              // Also exclude `html` and `json` extensions so they get processed
              // by webpacks internal loaders.
              exclude: [
                /^$/,
                /\.(js|mjs|jsx|ts|tsx)$/,
                /\.html$/,
                /\.json$/,
                /\.sass/,
                /\.scss$/,
              ],
              type: 'asset/resource',
            },
            // ** STOP ** Are you adding a new loader?
            // Make sure to add the new loader(s) before the "file" loader.
          ],
        },
      ],
    },
    plugins: [
      new CompressionPlugin({
        filename: '[path][base].gz',
        algorithm: 'gzip',
        test: /\.js$|\.css$|\.html$/,
        threshold: 10240,
        minRatio: 0.8,
      }),
      new CompressionPlugin({
        filename: '[path][base].br',
        algorithm: 'brotliCompress',
        test: /\.(js|css|html|svg)$/,
        compressionOptions: {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: 9,
          },
        },
        threshold: 10240,
        minRatio: 0.8,
      }),
      // Makes some environment variables available in index.html.
      // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
      // <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
      // In production, it will be an empty string unless you specify "homepage"
      // in `package.json`, in which case it will be the pathname of that URL.
      new ProgressBarPlugin(),
      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin(
        Object.assign(
          {},
          {
            inject: true,
            template: paths.appHtml,
          },
          {
            minify: {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              keepClosingSlash: true,
              minifyJS: true,
              minifyCSS: true,
              minifyURLs: true,
            },
          }
        )
      ),
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, enrichEnvVariables('raw')),
      // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === 'development') { ... }. See `./env.js`.
      new webpack.DefinePlugin(enrichEnvVariables('stringified')), // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
      // It is absolutely essential that NODE_ENV was set to production here.
      // Otherwise React will be compiled in the very slow development mode.
      // new webpack.DefinePlugin(env.stringified),
      // Note: this won't work without ExtractTextPlugin.extract(..) in `loaders`.
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: 'static/css/[name].[contenthash:8].css',
        chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
      }),
      // Generate a manifest file which contains a mapping of all asset filenames
      // to their corresponding output file so that tools can pick it up without
      // having to parse `index.html`.
      new WebpackManifestPlugin({
        fileName: 'asset-manifest.json',
        filter: ({ name }) => {
          return (
            !name.endsWith('.htaccess') &&
            !name.endsWith('.pdf') &&
            !name.endsWith('.xlsx') &&
            name.indexOf('htaccess') === -1 &&
            name.indexOf('-old') === -1 &&
            name.indexOf('_old') === -1
          );
        },
      }),
      // Enable the Rollbar Sourcemap plugin
      // This is a Webpack plugin that simplifies uploading the sourcemaps, generated from a webpack build, to Rollbar.
      // new RollbarSourceMapPlugin({
      //   accessToken: JSON.parse(
      //     env.stringified['process.env']['ROLLBAR_SERVER_KEY']
      //   ),
      //   version: 'v-1.0-rct',
      //   publicPath: publicPath,
      //   ignoreErrors: true,
      // }),
      // Generate a service worker script that will precache, and keep up to date,
      // the HTML & assets that are part of the Webpack build.
      new WorkboxWebpackPlugin.InjectManifest({
        swSrc: swSrc,
        swDest: 'service-worker.js',
        // Only skip cache busting for files that already have proper hashes
        dontCacheBustURLsMatching:
          /\.[0-9a-f]{8,13}\.(js|css|woff|woff2|png|jpg|jpeg|gif|svg)$/,
        exclude: [
          /\.map$/,
          /asset-manifest\.json$/,
          /LICENSE/,
          /\.mp4$/,
          /\.webm$/,
          /\.pdf$/,
          /\.xlsx$/,
          /\.htaccess$/,
        ],
        // Bump up the default maximum size (2mb) that's precached,
        // to make lazy-loading failure scenarios less likely.
        // See https://github.com/cra-template/pwa/issues/13#issuecomment-722667270
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Force update when build changes
        additionalManifestEntries: [
          {
            url: '/',
            revision: BUILD_VERSION, // Use build version as revision
          },
        ],
      }),
    ],
    optimization: {
      usedExports: true,
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        maxAsyncRequests: Infinity,
        enforceSizeThreshold: 50000,
        minSize: 76800,
        minChunks: 1,
        maxSize: 76800, // max chunk size: 75kb
        maxInitialSize: 76800, // max chunk size: 75kb
        maxAsyncSize: 76800, // max chunk size: 75kb
        cacheGroups: {
          vendor: {
            name: 'vendors', // part of the bundle name and
            // can be used in chunks array of HtmlWebpackPlugin
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            // name(module) {
            //   console.log('========', module.context);
            //   if (module.context.indexOf('node_modules') === -1) return;

            //   // get the name. E.g. node_modules/packageName/not/this/part.js
            //   // or node_modules/packageName
            //   const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
            //   // npm package names are URL-safe, but some servers don't like @ symbols
            //   return `npm.${packageName[1].replace('@', '')}`;
            // },
            reuseExistingChunk: true,
          },
          resources: {
            name: 'resources',
            test: /[\\/]src[\\/]assets[\\/]animations[\\/]/,
            chunks: 'all',
            reuseExistingChunk: true,
          },
          shared: {
            name: 'shared',
            test: /[\\/]src[\\/](constants|hooks)[\\/]/,
            chunks: 'all',
            reuseExistingChunk: true,
          },
          utils: {
            name: 'utils',
            test: /[\\/]src[\\/](utilities)[\\/]/,
            chunks: 'all',
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            test: /[\\/]src[\\/](atoms|components|molecules)[\\/]/,
            chunks: 'all',
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 1,
            priority: -20,
          },
        },
      },
      minimize: true,
      minimizer: [
        new TerserPlugin({
          test: /\.js(\?.*)?$/i,
          extractComments: true,
          parallel: true,
          terserOptions: {
            parse: {
              // We want terser to parse ecma 8 code. However, we don't want it
              // to apply any minification steps that turns valid ecma 5 code
              // into invalid ecma 5 code. This is why the 'compress' and 'output'
              // sections only apply transformations that are ecma 5 safe
              // https://github.com/facebook/create-react-app/pull/4234
              ecma: 8,
            },
            compress: {
              drop_console: false,
              pure_funcs: ['console.log', 'console.debug'],
              drop_debugger: true,
              ecma: 5,
              warnings: false,
              // Disabled because of an issue with Uglify breaking seemingly valid code:
              // https://github.com/facebook/create-react-app/issues/2376
              // Pending further investigation:
              // https://github.com/mishoo/UglifyJS2/issues/2011
              comparisons: false,
              // Disabled because of an issue with Terser breaking valid code:
              // https://github.com/facebook/create-react-app/issues/5250
              // Pending further investigation:
              // https://github.com/terser-js/terser/issues/120
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
          },
        }),
        // This is only used in production mode
        new CssMinimizerPlugin(),
      ],
      moduleIds: 'named',
    },
  };
};
