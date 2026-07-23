module.exports = {
  apps: [
    {
      name: 'connect-backend',
      script: 'src/server.js',
      cwd: './backend',
      watch: false,
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'connect-tools',
      script: 'Tools/server-logs.js',
      cwd: './',
      watch: false,
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'connect-frontend',
      script: 'node_modules/vite/bin/vite.js',
      cwd: './',
      watch: false,
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
