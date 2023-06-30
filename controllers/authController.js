const jwt = require('jsonwebtoken');
const crypto = require('crypto');
//const util = require('util') // promisify method
const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = id => {
  // jwt.method(data/payload, secret, options(expiresIn)
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// sending JWT as a String and a Cookie
const createAndSendToken = (res, statusCode, user) => {
  const token = signToken(user._id);
  // Create and send a cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), // 90days to ms
    //secure: true, // only will be sent in encrypted connection HTTPS
    httpOnly: true // so cookie cannot be accessed on modified in anyway. Receives cookie, stores it and sends it automatically with every request
  };
  if (process.env.NODE_ENV === 'productions') cookieOptions.secure = true;
  // name, value, cookieOptions
  res.cookie('jwt', token, cookieOptions); // name is a unique identifier for the cookie

  // remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
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

  createAndSendToken(res, 201, newUser);

  // 3) sending respons with token
  // const token = signToken(newUser._id);
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser
  //   }
  // });
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
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token
  // });

  createAndSendToken(res, 200, user);
});

// LogOut sets cookie with no TOKEN
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), // 10 sec
    httpOnly: true // with this option we cannot config cookie in any way
  });
  res.status(200).json({ status: 'success' });
};

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
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  //console.log(token);
  if (!token) {
    return next(new AppError('You are not logged in! Please log in!', 401)); // 401 unauthorized
  }
  // 2) Verification-Validate token
  // jwt.verify(token, secret, callback)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //console.log(decoded); // { id: '6492e104eb50c70808e10561', iat: creationDateTimeStamp, exp: 1695123460 }

  // 3) Check if user exists
  const currentUser = await User.findById(decoded.id); // User based on decoded id
  if (!currentUser) {
    return next(new AppError('The user with this token does not exists', 401));
  }

  // 4) Check if user password changed after token was issued
  // iat = issued at
  if (await currentUser.changedPasswordAfter(decoded.iat)) {
    //console.log(currentUser.changedPasswordAfter(decoded.iat));
    return next(
      new AppError('User recently changed passward. Log in again!', 401)
    );
  }
  // 5) Grant access to protected route
  req.user = currentUser;
  next();
});

// Only for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user exists
      const currentUser = await User.findById(decoded.id); // User based on decoded id
      if (!currentUser) {
        return next();
      }

      // 3) If user didnt change password
      if (await currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in user
      res.locals.user = currentUser; // res.locals.user passing data to template
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// wrapper function that returns the midleware function
// to pass in arguments into midleware
// ...roles will create an array with all arguments(arbitrary number)
exports.restrictTo = (...roles) => {
  // midleware
  return (req, res, next) => {
    // roles is an array ['admin', 'lead-guide'] available to midleware because of CLOSURE!
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action!', 403) // 403 forbiden
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError('There is no user with that email address', 404));
  // 2) Genereate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // will save but deactivate all validators

  // 3) Send back as an email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit PATCH request with new password and passwordConfirm to ${resetURL}.\nIf you didn't forget your password, please ignore this!`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message
    });
    res.status(200).json({
      status: 'success',
      message: 'Token is sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError(err, 500)); // 500 standart server error
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() } //if token is expired user will be undefiened
  });

  // 2) if token not expired, and user exists, set new password
  if (!user) {
    return next(new AppError('Token is invalid or has exipred', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) update changedPasswordAt for the current user

  // 4) log the user in/ send JWT
  // const token = signToken(user._id);
  // res.status(201).json({
  //   status: 'success',
  //   token
  // });

  createAndSendToken(res, 201, user);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from db
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if posted password is correct
  const passwordIsCorrect = await user.correctPassword(
    req.body.passwordCurrent,
    user.password
  );
  if (!passwordIsCorrect) {
    return next(new AppError('Your currect password is wrong.', 401));
  } // 401 unauthorized

  // 3) If correct, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByID would not work!

  // 4) log in by sending JWT
  // const token = signToken(user._id);
  // res.status(201).json({
  //   status: 'success',
  //   token
  // });

  createAndSendToken(res, 201, user);
});
