// this config is for pm2 & rate-limiter-flexible
module.exports = {
    apps: [
        {
            name: 'hackreg-t1-rate-limiter',
            script: './RateLimiterApp.js',
            instances: 1,
            autorestart: true,
        },
        {
            name: 'hackreg-t1-worker',
            script: './AppBootstrap.js',
            instances: 0,
            exec_mode: 'cluster',
            autorestart: true,
        },
    ],
};