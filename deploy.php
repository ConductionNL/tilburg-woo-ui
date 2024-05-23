<?php

namespace Deployer;

require 'recipe/common.php';
require 'contrib/rsync.php';

/********************
 * Project settings *
 ********************/
set('remote_user', 'tilburg');
set('application', 'OpenTilburg Portal UI');

/*********************
 *  Global settings  *
 *********************/
set('keep_releases', 2);
set('ssh_type', 'native');
set('ssh_multiplexing', true);
set('allow_anonymous_stats', false);

/********************
 *  RSYNC settings  *
 ********************/
add('rsync', [
    'exclude' => [
        '.git',
        '/storage/',
        '/vendor/',
        '/node_modules/',
        '.github',
        'deploy.php',
    ],
]);
set('rsync_src', './public_html');
set('rsync_dest', '{{release_path}}');

/*********************
 *       Hosts       *
 *********************/
// ACATO-dev-2
host('develop')
    ->set('hostname', '31.7.5.79')
    ->set('deploy_path', '~/ui.tilburg.dev.acato.nl');

// ACATO-dev-2
host('staging')
    ->set('hostname', '31.7.5.79')
    ->set('deploy_path', '~/ui.tilburg.staging.acato.nl');

// ACATO-prod-2
host('production')
    ->set('keep_releases', 3)
    ->set('hostname', '185.122.116.42')
    ->set('deploy_path', '~/open-tilburg.nl');

/*********************
 *       Tasks       *
 *********************/
task('deploy', [
    'deploy:info',
    'deploy:setup',
    'deploy:lock',
    'deploy:release',
    'rsync',
    'deploy:symlink',
    'deploy:unlock',
    'deploy:cleanup',
])->desc('Deploy project');

// Automatically unlock on failed deployment
after('deploy:failed', 'deploy:unlock');
