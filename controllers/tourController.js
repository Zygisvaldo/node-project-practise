const fs = require('fs');
const toursData = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8')
);

exports.chechID = (req, res, next, value) => {
  console.log(`Tour id is ${value}`);
  if (req.params.id * 1 > toursData.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  next();
};

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price)
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price',
    });
  next();
};

exports.getAllTours = (req, res) => {
  console.log(req.requestTime);
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: toursData.length,
    data: { tours: toursData },
  });
};

exports.getTour = (req, res) => {
  console.log(req.params); // data in the url are parameters
  const id = req.params.id * 1;
  const tourData = toursData[id];

  res.status(200).json({
    status: 'success',
    data: { tour: tourData },
  });
};

exports.createTour = (req, res) => {
  //console.log(req.body); // body is avaible because of midleware

  const newId = toursData[toursData.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);
  toursData.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(toursData), // stringufy converts object to json
    (err) => {
      // 201 created
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
  //res.send(`Done`);
};

exports.updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>',
    },
  });
};

exports.deleteTour = (req, res) => {
  // 204 means no content
  res.status(204).json({
    status: 'success',
    data: null,
  });
};
