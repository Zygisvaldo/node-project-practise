//const fs = require('fs');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
// 5) Aliasing (for example most popular request)
// midleware will set(prefill) query object
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage';
  req.query.fields = 'name, price, ratingsAverage, summary, difficulty';
  next();
};

exports.getAllTours = catchAsync(
  async (req, res, next) => {
    // try {
    //console.log(req.query);

    // BUILD QUERY
    // // 1A) FILTERING
    // // shallow copy of req.query/ creating new obj
    // const queryObj = { ...req.query };
    // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // excludedFields.forEach(el => delete queryObj[el]);

    // //console.log(req.query, queryObj);

    // // const toursData = await Tour.find({
    // //   duration: 5,
    // //   difficulty: 'easy'
    // // });

    // // returns query so we can use methods on it
    // // const toursData = await Tour.find()
    // //   .where('duration')
    // //   .equals(5)
    // //   .where('difficulty')
    // //   .equals('easy');

    // // 1B) Advanced filtering

    // // mongoDB {difficulty: 'easy', duration :{ $gte: 5}}
    // // query obj from url { difficulty: 'easy', duration: { gte: '5' } }
    // // gte, gt, lte, lt

    // let queryStr = JSON.stringify(queryObj); //

    // // replacing regular expressions by adding $ to it.
    // // b - for exact match
    // // g - for multiple occurencies
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // //console.log(JSON.parse(queryStr));

    // let query = Tour.find(JSON.parse(queryStr)); // retuns a query so we can chain other methods on it

    // // 2) Sorting
    // if (req.query.sort) {
    //   // sorting by several parameters
    //   const sortBy = req.query.sort.split(',').join(' ');
    //   //console.log(sortBy);
    //   //query = query.sort(req.query.sort);
    //   query = query.sort(sortBy);

    //   // sort('price ratingsAverage')
    // } else {
    //   query = query.sort('-createdAt'); // default sorting
    // }

    // // 3) Field limiting
    // if (req.query.fields) {
    //   const fields = req.query.fields.split(',').join(' ');
    //   //query = query.select('name duration price') // seperated by space/ projecting
    //   query = query.select(fields);
    // } else {
    //   query = query.select('-__v'); // - for excluding fields
    // }

    // // 4) Pagination
    // const page = req.query.page * 1 || 1; // this or || default value
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page - 1) * limit; // previous page * limit of results on each page

    // // ?page2&limit=10 (1-10 page1), (11-20 page2)
    // query = query.skip(skip).limit(limit); // skip amount of results before quering data (skip 10 to start with 11)

    // if (req.query.page) {
    //   const numTours = await Tour.countDocuments(); // return promise of num of docs
    //   if (skip >= numTours) throw new Error('This page does not exists');
    // }

    // EXECUTE QUERY
    // creating an instance
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate(); // chaining works because we return this

    const toursData = await features.query;
    // query.sort().select().skip().limit() query example

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      //requestedAt: req.requestTime,
      results: toursData.length,
      data: { tours: toursData }
    });
  }
  // catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err
  //   });
  // }
  //}
);

exports.getTour = catchAsync(async (req, res, next) => {
  //try {
  // console.log(req.params); // data in the url are parameters
  //const id = req.params.id * 1;
  // Tour.findOne({ _id: req.params.id })
  // .populate('guides') <- this will fill the guides field in the model
  const tourData = await Tour.findById(req.params.id).populate('reviews');
  // .populate({
  //   path: 'guides',
  //   select: '-__v -passwordChangedAt'
  // });
  //const tourData = toursData[id];

  if (!tourData) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: tourData
    }
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err
  //   });
  // }
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
  // try {
  //   //console.log(req.body); // body is avaible because of midleware
  //   // const newTour = new Tour({
  //   //   newTour.save()
  //   // })
  //   // rejected promises enter the catch block
  // } catch (err) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: err //'Invalid data sent!'
  //   });
  // }
});

exports.updateTour = catchAsync(async (req, res, next) => {
  //try {
  const updatedTourData = await Tour.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true, // updated doc will be sent
      runValidators: true
    }
  );
  if (!updatedTourData) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour: updatedTourData
    }
  });
  // } catch (err) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: 'Invalid data sent!'
  //   });
  // }
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  //try {
  // await for deletion
  const deleteTour = await Tour.findByIdAndDelete(req.params.id);
  // 204 means no content
  if (!deleteTour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
  // } catch (err) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: 'Invalid data sent!'
  //   });
  // }
});

// Aggregation pipeline
exports.getTourStats = catchAsync(async (req, res, next) => {
  // try {
  const stats = await Tour.aggregate([
    // stages
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      // group documents together by field or all
      $group: {
        //_id: null, // null = all
        // field names are overwritten
        _id: { $toUpper: '$difficulty' }, //
        numTours: { $sum: 1 }, // 1 for each doc
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: {
        avgPrice: 1 // 1 for ascending
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: { stats }
  });
  // } catch (err) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: 'Invalid data sent!'
  //   });
  // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  //try {
  const year = req.params.year * 1; // 2022
  const plan = await Tour.aggregate([
    {
      // unwind deconstructs array field from imput doc and output 1 doc for each element
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        // what to use to group docs: { operator(by what) : data extracted from field name}
        // id: will be month extracted form startDates field
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 }, // for each doc 1
        tours: { $push: '$name' } // push makes an array
      }
    },
    {
      // new field named month: with value of id
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0 // id would not show up
      }
    },
    {
      $sort: {
        numTourStarts: -1 // -1 descending
      }
    },
    {
      $limit: 12 // 12 outputs
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: { plan }
  });
  // } catch (err) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: 'Invalid data sent!'
  //   });
  // }
});
