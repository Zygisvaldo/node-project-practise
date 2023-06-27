const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Uncaught exceptions are error of sync code, that were not handled anywhere
// Must be on the very top level!
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down..');
  console.log(err);
  process.exit(1);
});
//console.log(x); // is not defined

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// connection to db
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(con =>
    //console.log(con.connections);
    console.log('DB connection successful!')
  );
// example of catching UNHANDLED REJECTIONS
//.catch(err => console.log('Error'));

// connecting config.env file to the node
// running app only after the config is required
// console.log(app.get('env')); // development
// console.log(process.env)
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Unhandled rejections (rejected promises)
// if unhandled rejection process object will emit an object called unhandled rejection
// all promise rejections
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down..');
  console.log(err.name, err.message);
  // 1) shut down the server
  server.close(() => {
    // 2) shut down the app
    process.exit(1); // 0 success, 1 uncaught exception
  });
});
