const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
//const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// accessing reviews through the tours
// POST /tour/tourId/reviews and user ID will come from currently logedIn user through JWT. This is called nested routes. reviews are children of the tour.

// GET /tour/tourID/reviews
// GET /tour/tourID/reviews/reviewId

// router
//   .route('/:tourId/reviews') //  will be available through req.params.tourId
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

// for this specific route we use another router
router.use('/:tourId/reviews', reviewRouter); // redirecting to another router

// Example of importing methods by name ----------------------------------
// const {
//   getAllTours,
//   createTour,
//   getTour,
//   updateTour,
//   deleteTour,
// } = require('./../controllers/tourController.js');

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

// GEOSPACIAL ENDPOINT
// tours-within/:distance(distance selected) /center/:latlng(user coordinates) /unit/:unit(km or miles)
router
  //{ distance, latlng, unit } = req.params
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

// Best practise to specify URL:
// /tours-within/300/center/-40,45/unit/km

// Other practise:
// /tours-within?distance=300&center=-40,45&unilt=km

// Distance from a certain point (:latlng) to all tours
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

// this midleware function only runs if there is any params
//router.param('id', tourController.chechID);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
