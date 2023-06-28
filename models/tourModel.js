const mongoose = require('mongoose');
const slugify = require('slugify');
//const User = require('./userModel');
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
      max: [5, 'Rating must be equal or below 5.0'],
      // sets a value with call back function
      set: val => Math.round(val * 10) / 10 // 4.66666 => 46.6666 => 47 => 4.7
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
    },
    // Geospacial data - GeoJSON
    // to create this on mongo DB we need to specify and object with at least 2 parameters type & coordinates
    startLocation: {
      type: {
        type: String,
        default: 'Point', // or other geometries
        enum: ['Point'] // all possible choises
      },
      coordinates: [Number], // array of numbers (longitude latitude) GeoJSON only! Mostly is (latitude&longitude)
      address: String,
      description: String
    },
    // embedded documents [{}] - by specifiening an array [] of documents {}, this will create a new documents inside the parent document (Tour)
    // one object for each location
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number // the day of the tour when this location will be reached
      }
    ],
    //guides: Array // embeding users
    guides: [
      // referencing data. Populate(fill the data) happens in tour controller where we build our query (getTour). Or in query middleware .pre(/^find/, populateGuides)
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User' // model name
      }
    ]
  },
  {
    // schema options object
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
// Creating Index for better performance on most used queries:
//tourSchema.index({ price: 1 }); // 1 for ascending order, -1 for dsc
tourSchema.index({ price: 1, ratingsAverage: -1 }); // compound index, works also if query is with one field

tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); // index for GEOSPACIAL coordinates. Earth like sphere with real coordinates

// Virtual properties
// properties that can be calculated will be created each time on get request.
// virtual properties cannot be used for query
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7; // arrow fnc does not have this keyword
});

// Child referencing without saving data in the DB:
// Virtual populate. Connecting models
tourSchema.virtual('reviews', {
  // connecting 2 model via common field (foreignField === localField)
  ref: 'Review',
  foreignField: 'tour', // name in the Review model where the ref of tour is held
  localField: '_id' // where in this Tour model the same value is held (_id)
});

// Mongoose middlewares
// DOCUMENT MIDDLEWARE: runs before .save() and .create() and not on .update()
tourSchema.pre('save', function(next) {
  // pre - before doc is saved
  //console.log(this); // this point to a currently processed document
  // slug is string that we can put in the url
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Embeding data into Tours model
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id)); // array of all promises. A promise for each id.
//   // setting resolved promises as values. Complete documents of users.
//   this.guides = await Promise.all(guidesPromises); // overwriting array of ID's with array of user documents

//   //console.log('Will save document...');
//   next();
// });

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

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

// post doc middleware. after all pre functions
tourSchema.post('save', function(doc, next) {
  // post does not have this but instead has doc- finished document
  //console.log(doc);
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  //console.log(`Query took ${Date.now() - this.start} miliseconds`);
  next();
});

// Aggregation midleware
// tourSchema.pre('aggregate', function(next) {
//   // adding a $match stage to the beginning of pipeline
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   //console.log(this); // this points at the aggregate function in controller
//   next();
// });

// model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
