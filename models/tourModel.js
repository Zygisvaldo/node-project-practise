const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');
// schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters'] // for validation to execute in the controller functions options runValidators must be set to true

      //validate: [validator.isAlpha, 'Tour name must not contain numbers'] // 3rd party validator is an object with methods
    },
    slug: {
      type: String
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      // enum - only specified values are allowed
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty can be: easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be equal or above 1.0'],
      max: [5, 'Rating must be equal or below 5.0']
    },
    retingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        //custom validator
        validator: function(val) {
          //console.log(val);
          // this only points at a current doc on NEW doc creation, and will not work on update
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: true
    },
    description: {
      type: String,
      trim: [true, 'A tour must have a description']
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have an image']
    },
    images: [String], // array of strings
    createdAt: {
      type: Date,
      default: Date.now(), // auto converted in mongoose
      select: false // excluding from the output (passwords & etc.)
    },
    startDates: [Date], // unix timestamp
    secretTour: {
      type: Boolean,
      default: false
    }
  },
  {
    // schema options object
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual properties
// properties that can be calculated will be created each time on get request.
// virtual properties cannot be used for query
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7; // arrow fnc does not have this keyword
});

// Mongoose middlewares
// Documents midleware: runs before .save() and .create() and not on .update()
tourSchema.pre('save', function(next) {
  // pre - before doc is saved
  //console.log(this); // this point to a currently processed document
  // slug is string that we can put in the url
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre('save', function(next) {
  //console.log('Will save document...');
  next();
});

// post doc middleware. after all pre functions
tourSchema.post('save', function(doc, next) {
  // post does not have this but instead has doc- finished document
  //console.log(doc);
  next();
});

// Query midleware
//tourSchema.pre('find', function(next) {
// /^find/ - is regular expression. Will execute for every method that starts with find
tourSchema.pre(/^find/, function(next) {
  //console.log(this); // this points at current query object
  this.find({ secretTour: { $ne: true } });

  // clock for calculating time it takes to execute
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  //console.log(`Query took ${Date.now() - this.start} miliseconds`);
  next();
});

// Aggregation midleware
tourSchema.pre('aggregate', function(next) {
  // adding a $match stage to the beginning of pipeline
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  //console.log(this); // this points at the aggregate function in controller
  next();
});

// model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
