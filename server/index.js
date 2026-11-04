const app = require('./app');
const connectDB = require('./config/db');

const port = process.env.PORT || 4000;

console.log("environment ==========", process.env.NODE_ENV);

// Listen only after the database is reachable; connectDB exits the process on failure
connectDB().then(() => {
  app.listen(port, () => {
    console.log("Connected to port " + port);
  }).on('error', (err) => {
    console.error(err.code === 'EADDRINUSE' ? `Port ${port} is already in use` : err.message);
    process.exit(1);
  });
});
