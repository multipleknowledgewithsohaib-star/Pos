module.exports = {
  apps: [
    {
      name: 'pharma-web',
      cwd: __dirname,
      script: 'npm',
      args: 'run start:web',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: 'pharma-api',
      cwd: __dirname,
      script: 'npm',
      args: 'run start:api',
      env: {
        NODE_ENV: 'production',
        PORT: '4000',
        HOST: '0.0.0.0',
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
