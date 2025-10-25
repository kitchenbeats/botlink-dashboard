module.exports = {
  apps: [
    {
      name: "nextjs",
      script: "npm",
      args: "run dev -- --hostname 0.0.0.0 --port 3000",
      cwd: "/templates/nextjs-basic",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000
    }
  ]
};
