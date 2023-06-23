const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDublicateFieldsDB = err => {
  //const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]; // or RegEx
  const message = `Dublicate field value: ${err.keyValue.name}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  // err is an object of objects (err:{errors:{{name:smth}, {name:smth}, {name:smth}}})
  // Object.values to loop over an object
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
    // Programing or unknown error:
  } else {
    // All unhandled errors will show generic error message
    // 1) Log error
    console.error('ERROR 💥', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something when wrong!'
    });
  }
};

const handleJWTError = () => new AppError('Invalid token. Please log in!', 401);

const handleJWTExpirationError = () =>
  new AppError('Token has exipred! Please log in again', 401);

module.exports = (err, req, res, next) => {
  // console.log(err.stack); // will show us where the error happened
  // err statusCode if defiened or 500
  // some error will be without statusCode, like err coming from mongoose
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);

    // Operational or programing errors
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    if (err.name === 'CastError')
      // error will be AppError
      error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDublicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpirationError();

    sendErrorProd(error, res);
  }
};
