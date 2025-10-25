module.exports = {
  apps: [
    {
      name: "nextjs",
      script: "pnpm",
      args: "dev --hostname 0.0.0.0 --port 3000",
      cwd: "/templates/nextjs-saas",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000
    }
  ]
};
