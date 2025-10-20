module.exports = {
  apps: [
    {
      name: "http-server",
      script: "npx",
      args: "http-server . -p 3000 -c-1",
      cwd: "/templates/simple-html",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000
    },
    {
      name: "claude-pty",
      script: "/templates/simple-html/configs/claude-pty-manager.js",
      cwd: "/templates/simple-html",
      autorestart: true,
      max_restarts: 5,
      restart_delay: 3000,
      env: {
        // These will be set dynamically when starting via API
        PROJECT_ID: process.env.PROJECT_ID || "",
        REDIS_URL: process.env.REDIS_URL || "",
        WORK_DIR: "/templates/simple-html"
      }
    }
  ]
};
