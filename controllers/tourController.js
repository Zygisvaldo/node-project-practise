//const fs = require('fs');
const Tour = require('./../models/tourModel');

// 5) Aliasing (for example most popular request)
// midleware will set(prefill) query object
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage';
  req.query.fields = 'name, price, ratingsAverage, summary, difficulty';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    console.log(req.query);

    // BUILD QUERY
    // 1A) FILTERING
    // shallow copy of req.query/ creating new obj
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    //console.log(req.query, queryObj);

    // const toursData = await Tour.find({
    //   duration: 5,
    //   difficulty: 'easy'
    // });

    // returns query so we can use methods on it
    // const toursData = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    // 1B) Advanced filtering

    // mongoDB {difficulty: 'easy', duration :{ $gte: 5}}
    // query obj from url { difficulty: 'easy', duration: { gte: '5' } }
    // gte, gt, lte, lt

    let queryStr = JSON.stringify(queryObj); //

    // replacing regular expressions by adding $ to it.
    // b - for exact match
    // g - for multiple occurencies
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    //console.log(JSON.parse(queryStr));

    let query = Tour.find(JSON.parse(queryStr)); // retuns a query so we can chain other methods on it

    // 2) Sorting
    if (req.query.sort) {
      // sorting by several parameters
      const sortBy = req.query.sort.split(',').join(' ');
      //console.log(sortBy);
      //query = query.sort(req.query.sort);
      query = query.sort(sortBy);

      // sort('price ratingsAverage')
    } else {
      query = query.sort('-createdAt'); // default sorting
    }

    // 3) Field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      //query = query.select('name duration price') // seperated by space/ projecting
      query = query.select(fields);
    } else {
      query = query.select('-__v'); // - for excluding fields
    }

    // 4) Pagination
    const page = req.query.page * 1 || 1; // this or || default value
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit; // previous page * limit of results on each page

    // ?page2&limit=10 (1-10 page1), (11-20 page2)
    query = query.skip(skip).limit(limit); // skip amount of results before quering data (skip 10 to start with 11)

    if (req.query.page) {
      const numTours = await Tour.countDocuments(); // return promise of num of docs
      if (skip >= numTours) throw new Error('This page does not exists');
    }

    // EXECUTE QUERY
    const toursData = await query;
    // query.sort().select().skip().limit() query example

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      //requestedAt: req.requestTime,
      results: toursData.length,
      data: { tours: toursData }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    // console.log(req.params); // data in the url are parameters
    //const id = req.params.id * 1;
    // Tour.findOne({ _id: req.params.id })
    const tourData = await Tour.findById(req.params.id);
    //const tourData = toursData[id];

    res.status(200).json({
      status: 'success',
      data: { tour: tourData }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    //console.log(req.body); // body is avaible because of midleware

    // const newTour = new Tour({
    //   newTour.save()
    // })
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour
      }
    });
    // rejected promises enter the catch block
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err //'Invalid data sent!'
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const updatedTourData = await Tour.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, // updated doc will be sent
        runValidators: true
      }
    );
    res.status(200).json({
      status: 'success',
      data: {
        tour: updatedTourData
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid data sent!'
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    // await for deletion
    await Tour.findByIdAndDelete(req.params.id);
    // 204 means no content
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid data sent!'
    });
  }
};
