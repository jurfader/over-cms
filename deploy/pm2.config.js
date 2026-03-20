// PM2 Ecosystem — OverCMS
// Uruchom: pm2 start deploy/pm2.config.js
// Zapisz:  pm2 save

const ROOT = '/home/overcms/app'

module.exports = {
  apps: [
    // ── API ─────────────────────────────────────────────────────────────────
    {
      name:      'overcms-api',
      cwd:       `${ROOT}/apps/api`,
      script:    'node',
      args:      'dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT:     '3001',
      },
      max_memory_restart: '300M',
      restart_delay:      3000,
      log_file:           '/var/log/overcms/api.log',
      error_file:         '/var/log/overcms/api.error.log',
      time:               true,
    },

    // ── Admin ────────────────────────────────────────────────────────────────
    {
      name:      'overcms-admin',
      cwd:       `${ROOT}/apps/admin`,
      script:    'node',
      args:      '.next/standalone/server.js',
      env: {
        NODE_ENV: 'production',
        PORT:     '3000',
        HOSTNAME: '127.0.0.1',
      },
      max_memory_restart: '400M',
      restart_delay:      3000,
      log_file:           '/var/log/overcms/admin.log',
      error_file:         '/var/log/overcms/admin.error.log',
      time:               true,
    },

    // ── Corporate site (overmedia.pl) ────────────────────────────────────────
    {
      name:      'overcms-site',
      cwd:       `${ROOT}/templates/corporate`,
      script:    'node',
      args:      '.next/standalone/server.js',
      env: {
        NODE_ENV: 'production',
        PORT:     '3002',
        HOSTNAME: '127.0.0.1',
      },
      max_memory_restart: '400M',
      restart_delay:      3000,
      log_file:           '/var/log/overcms/site.log',
      error_file:         '/var/log/overcms/site.error.log',
      time:               true,
    },
  ],
}
