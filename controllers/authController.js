const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// new user
exports.signup = catchAsync(async (req, res, next) => {
  //const newUser = await User.create(req.body);
  // only specified fields, so for example role:'admin' would not be added
  // 1) creating user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  // 2) creating token
  // import from config.env file: process.env.VARIABLE
  // jwt.method(data/payload, secret, options(expiresIn))
  //   const token =  jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //     expiresIn: process.env.JWT_EXPIRES_IN
  //   });

  const token = signToken(newUser._id);

  // 3) sending respons with token
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

// logging in user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) checking if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) checking if user exists and compare password
  // {fieldName: value}
  // .select('+password') because its not visible so we explicetly select it
  const user = await User.findOne({
    email: email
  }).select('+password');

  // this will compare in userModel and return true/false

  //const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If OK, send token to client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token
  });
});

//
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // authorization: 'Bearer TokenTokenToken'
    token = req.headers.authorization.split(' ')[1];
  }
  //console.log(token);
  if (!token) {
    return next(new AppError('You are not logged in! Please log in!', 401)); // 401 unauthorized
  }
  // 2) Verification-Validate token

  // 3) Check if user exists

  // 4) Check if user password changed after token was issued

  // 5)
  next();
});
