// review / rating / createdAt / ref to the tour / ref to the user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, ' Review cannot be empty']
    },
    rating: {
      type: Number,
      max: 5,
      min: 1
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    // child referencing parent (Parent referencing) by holding its ID
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },
    user: {
      // in order to see data of user but not just id, we need to populate
      type: mongoose.Schema.ObjectId,
      ref: 'User', // populate will look in this User ref to find the exact user by ID and then pre middleware will be executed
      required: [true, 'Review must belong to a user']
    }
  },
  // Virtual properties
  {
    // when there is a virtual property, we want to show it as an output
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// pre (find) -> all findById, findOne ....
reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // })
  //.populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

// DOCUMENT MIDDLEWARE
// 1) Calculating statistics as a static metdod sp we can call aggregate method on Model
reviewSchema.statics.calcAverageRating = async function(tourId) {
  // this point at the current model
  // we call aggregate only on the model
  const stats = await this.aggregate([
    {
      // selecting a tour that we want to update
      $match: {
        tour: tourId
      }
    },
    {
      // calculating statistics by grouping id: commonField
      $group: {
        _id: '$tour', // matching the document by id
        nRatings: {
          $sum: 1
        }, // add 1 for each document
        avgRating: {
          $avg: '$rating'
        } // calculatin avg from all rating fields
      }
    }
  ]);
  // 2) persisting statistics to the Tour document
  if (stats.length > 0) {
    //console.log(stats);
    // [ { _id: 649aeb53008834376840510d, nRatings: 4, avgRating: 4.5 } ]
    await Tour.findByIdAndUpdate(tourId, {
      retingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      retingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

// 3) Calling calcStats after each time a new review is saved
// query middleware
// calling the statistis to calculate avgRating, nRatings fields for every review created. Post save because on Pre save the review is not yet on the DB
reviewSchema.post('save', function() {
  // in the middleware THIS points to the current review
  // this.constructor point to the model (Review)
  this.constructor.calcAverageRating(this.tour);
});

// QUERY MIDDLEWARE on DOCUMENT:
// Goal is to get access to the current reviewDocument, while THIS points to the current query
// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
  // this.r (creating property on this variable) to pass data from pre to post middleware
  this.r = await this.findOne(); // Execute the QUERY to get the DOCUMENT
  //console.log(this.r); // r - reviewDocument
  next();
});

// When review has been updated or deleted, we call calcAverageRating
reviewSchema.post(/^findOneAnd/, async function() {
  // this.r = await this.findOne() <- this does not work in post because the query has been executed
  // this.r is the reviewDocument on which static methods can be called
  await this.r.constructor.calcAverageRating(this.r.tour); // this.r.tour is tourId
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
