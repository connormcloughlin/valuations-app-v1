/**
 * Template configuration file
 * Copy this file to config.js and fill in your actual values
 */

module.exports = {
  db: {
    host: "YOUR_DB_HOST",
    user: "YOUR_DB_USER",
    password: "YOUR_DB_PASSWORD",
    name: "YOUR_DB_NAME",
    port: 1433,
  },
  jwtSecret: "YOUR_JWT_SECRET_KEY",
  server: {
    port: 5000,
    host: "localhost"
  }
}; 