// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'biblioteca',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 4501',
    cwd: '/var/www/html/biblioteca',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm Z'
  }]
}
