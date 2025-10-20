module.exports = {
  apps: [
    {
      name: "nextjs",
      script: "npm",
      args: "run dev -- --hostname 0.0.0.0 --port 3000",
      cwd: "/templates/nextjs-basic",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      wait_ready: true,
      listen_timeout: 30000
    },
    {
      name: "claude-pty",
      script: "/templates/nextjs-basic/configs/claude-pty-manager.js",
      cwd: "/templates/nextjs-basic",
      autorestart: true,
      max_restarts: 5,
      restart_delay: 3000,
      env: {
        // These will be set dynamically when starting via API
        PROJECT_ID: process.env.PROJECT_ID || "",
        REDIS_URL: process.env.REDIS_URL || "",
        WORK_DIR: "/templates/nextjs-basic"
      }
    }
  ]
};
