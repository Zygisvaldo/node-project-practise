class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // calling parent contructor. Error only receives a message
    this.statusCode = statusCode;
    // `${statusCode}` converts to a String
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // all error will have this property.
    // When a new object is created, the contructor function will not apear in the stackTrace and not pollute it:
    Error.captureStackTrace(this, this.contructor);
  }
}

module.exports = AppError;
