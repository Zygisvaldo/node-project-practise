const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet'); // for setting security HTTP headers
const mongoSanitize = require('express-mongo-sanitize'); // express-mongo-sanitize
const xss = require('xss-clean'); // xss-clean
const hpp = require('hpp'); // hyper parameter pollution

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// 1.GLOBAL MIDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
//console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // http request logger
}

// Limiting requests from same API
const limiter = rateLimit({
  max: 100, // 100 requests
  windowMS: 60 * 60 * 1000, // 1h to ms
  message: 'Too many requests. Try again in an hour!'
});

app.use('/api', limiter); // applying limiter only for url's that starts with /api

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // adding midleware, handling the incoming request data

// Cleaning data against NoSQL query injection
app.use(mongoSanitize()); // this looks at the request body and filter outs $ signs

// Data sanitization agains xss cross site scipting such as "email" : {"$gt":""} in the body
app.use(xss()); // will clean input form HTML code with JS code attached to it. Basically converts all HTML simbols

// Prevent parameter pollution. Clears up query string
app.use(
  hpp({
    whitelist: [
      // whitelist is an array of properties where we allow duplicate String
      'duration',
      'retingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// Serving static files
app.use(express.static(`${__dirname}/public`));

// defining own midleware before route handlers
// app.use((req, res, next) => {
//   console.log('Hollo from the midleware 😊');
//   next();
// });

// Test midleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers);
  next();
});

// 3. ROUTES
// using different route midlewares on diff routes
app.use('/api/v1/tours', tourRouter); // mounting a new router on a route
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

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
