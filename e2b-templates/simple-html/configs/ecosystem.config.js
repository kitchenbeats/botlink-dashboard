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
    }
  ]
};
