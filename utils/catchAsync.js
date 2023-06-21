// catchAsync returns a function that we use to wrap async functions instead of using try/catch block
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => next(err));
  };
};
