module.exports = {
  apps: [
    // Development server (always running, port 3000)
    {
      name: "nextjs-dev",
      script: "pnpm",
      args: "dev --hostname 0.0.0.0 --port 3000",
      cwd: "/templates/nextjs-saas",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      env: {
        NODE_ENV: "development",
        PORT: "3000"
      }
    },
    // Production preview (port 3001, manual start/stop for testing)
    {
      name: "nextjs-prod",
      script: "pnpm",
      args: "start --hostname 0.0.0.0 --port 3001",
      cwd: "/templates/nextjs-saas",
      autorestart: false, // Don't auto-restart, only run when testing
      env: {
        NODE_ENV: "production",
        PORT: "3001"
      }
    }
  ]
};
