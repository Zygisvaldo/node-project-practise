//const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp'); // img processing lib
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   // destination has access to req, file and callBackFunction
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-ID-TimeStamp.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });
const multerStorage = multer.memoryStorage(); // buffer not in disc

// testing if uploaded file is img
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Only image files!', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
}); // saving uploaded images. First uploading img to file system and then saving link in DB

// upload.single('photo') field in the form that is going to upload the img
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  // on buffer filename is not set, so defining it here:
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  // resizing img
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next(); // will call updateMe handler function
});

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
  next();
};

// update currenctly authenticaded user
exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  // 1) Create error if user post password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('Cannot update password here!', 400));
  }

  // 2) update user document
  // body.role = 'admin' - NOT ALLOWED!
  // filteredBody is our options object
  // filtering out unwanted field names such as body.role = 'admin' - NOT ALLOWED to be updated!
  const filteredBody = filterObj(req.body, 'name', 'email');
  // adding photo property to an object that will be updated (storing img file name in DB)
  if (req.file) filteredBody.photo = req.file.filename;
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
