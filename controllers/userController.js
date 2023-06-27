//const fs = require('fs');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  // ...x for arbitrary number of arguments. Created an array with all arguments
  // loop through an object
  // Object.keys(obj) returns array of objects keys. And then we can loop them
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) {
      // key = value
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

// const usersData = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/users.json`, 'utf-8')
// );

exports.getAllUsers = factory.getAll(User);
// catchAsync(async (req, res) => {
//   const users = await User.find();

//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: { users }
//   });
// });

exports.getMe = (req, res, next) => {
  // seting URL param ID to User id from JWT (from authController.protect)
  req.params.id = req.user.id;
  next()
};

// update currenctly authenticaded user
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user post password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('Cannot update password here!', 400));
  }

  // 2) update user document
  // body.role = 'admin' - NOT ALLOWED!
  // filteredBody is our options object
  // filtering out unwanted field names such as body.role = 'admin' - NOT ALLOWED to be updated!
  const filteredBody = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  // 3) response
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  // 204 deleted
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Not needed because we have signUp user in the authController:
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead!'
  });
};

exports.getUser = factory.getOne(User);
// Do NOT update passwords with this:
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
