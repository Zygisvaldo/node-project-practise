// review / rating / createdAt / ref to the tour / ref to the user
const mongoose = require('mongoose');

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

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;

