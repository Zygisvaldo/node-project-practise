//const fs = require('fs');
const Tour = require('./../models/tourModel');

exports.getAllTours = async (req, res) => {
  try {
    const toursData = await Tour.find();
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
