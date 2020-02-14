// this config is for pm2 & rate-limiter-flexible
module.exports = {
  apps: [
    {
      name: 'hackreg-t1-rate-limiter',
      script: './rateLimiter.js',
      instances: 1,
      autorestart: true
    },
    {
      name: 'hackreg-t1-worker',
      script: './appBootstrap.js',
      instances: 0,
      // eslint-disable-next-line @typescript-eslint/camelcase
      exec_mode: 'cluster',
      autorestart: true,
      env: {
        NODE_ENV: 'production'
      },
      // eslint-disable-next-line @typescript-eslint/camelcase
      env_development: {
        NODE_ENV: 'development'
      }
    }
  ]
};
