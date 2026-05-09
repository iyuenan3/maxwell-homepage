module.exports = {
  apps: [{
    name: 'maxwellii-chat-api',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/home/admin/maxwellii-chat-api',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
    },
    interpreter: 'node',
    max_memory_restart: '512M',
    error_file: '/home/admin/logs/maxwellii-chat-api-error.log',
    out_file: '/home/admin/logs/maxwellii-chat-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
