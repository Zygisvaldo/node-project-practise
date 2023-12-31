const Review = require('./../models/reviewModel');
//const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getAllReviews = factory.getAll(Review);
// catchAsync(async (req, res, next) => {
//   let filter = {};
//   // if tourId is present then it will show only its reviews (on get method)
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const reviews = await Review.find(filter);
//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews
//     }
//   });
// });

// setting ids before creating review
exports.setTourUserIds = (req, res, next) => {
  // User can manually specify tour and user id, or we define from url
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id; // form protect
  next();
};

exports.createReview = factory.createOne(Review);
// catchAsync(async (req, res, next) => {
//   if (!req.body.tour) req.body.tour = req.params.tourId;
//   if (!req.body.user) req.body.user = req.user.id; middleware
//   const newReview = await Review.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       review: newReview
//     }
//   });
// });

exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.getOne(Review);
