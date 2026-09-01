// PM2 config for production deployment on AWS EC2
module.exports = {
  apps: [
    {
      name: 'instant-mechanic-api',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
