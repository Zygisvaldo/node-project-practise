const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1. MIDLEWARES
//console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // http request logger
}

app.use(express.json()); // adding midleware, handling the incoming request data

app.use(express.static(`${__dirname}/public`));

// defining own midleware before route handlers
// app.use((req, res, next) => {
//   console.log('Hollo from the midleware 😊');
//   next();
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3. ROUTES
// using different route midlewares on diff routes
app.use('/api/v1/tours', tourRouter); // mounting a new router on a route
app.use('/api/v1/users', userRouter);

// 4. UNHANDLED ROUTES. all req that pass to this point and not in the 3rd section (above)
// all http methods get, post ....
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Cannot find ${req.originalUrl} on this server`
  // });

  // const err = new Error(`Cannot find ${req.originalUrl} on this server 😢`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Cannot find ${req.originalUrl} on this server! 😢`, 404)); // if next(err) receives an argument express automaticaly knows that it is an error
});

// 5. OPERATIONAL ERROR HANDLING
app.use(globalErrorHandler);
// app.use((err, req, res, next) => {
//   console.log(err.stack); // will show us where the error happened
//   // err statusCode if defiened or 500
//   // some error will be without statusCode, like err coming from node.js
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';
//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message
//   });
//   next();
// });

module.exports = app;
