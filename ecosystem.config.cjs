module.exports = {
  apps: [
    {
      name: "garsame-v3",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/var/www/garsame-v3",
      instances: 2,
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/var/log/garsame/error.log",
      out_file: "/var/log/garsame/out.log",
      merge_logs: true,
      autorestart: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
