const PM2_NAME = 'nassay'
const PM2_PORT = 3000;

module.exports = {
  apps: [{
    name: PM2_NAME,
    port: PM2_PORT,
    script: "./inviter_bot.js",
    watch: false
  }]
};