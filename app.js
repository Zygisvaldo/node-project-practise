const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes.js');
const userRouter = require('./routes/userRoutes.js');

const app = express();

// 1. MIDLEWARES
//console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // http request logger
}

app.use(express.json()); // adding midleware, handling the incoming request data

app.use(express.static(`${__dirname}/public`));

// defining own midleware before route handlers
app.use((req, res, next) => {
  console.log('Hollo from the midleware 😊');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3. ROUTES
// using different route midlewares on diff routes
app.use('/api/v1/tours', tourRouter); // mounting a new router on a route
app.use('/api/v1/users', userRouter);

module.exports = app;
