module.exports = {
  apps: [
    {
      name: 'sunny_all',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: '1', // 可以設置為特定數量或 'max'（使用所有可用核心）
      exec_mode: 'cluster', // 集群模式
      watch: false,
      env: {
        PORT: 3010, // 與開發環境一致的端口
        NODE_ENV: 'production',
      },
      env_development: {
        PORT: 3010, 
        NODE_ENV: 'development',
      }
    }
  ]
}; 