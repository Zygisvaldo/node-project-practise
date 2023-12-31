class APIFeatures {
  // mongoose query, url query form express
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1A) FILTERING
    // shallow copy of req.query/ creating new obj
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);
    // 1B) Advanced filtering

    let queryStr = JSON.stringify(queryObj); //

    // replacing regular expressions by adding $ to it.
    // b - for exact match
    // g - for multiple occurencies
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    //console.log(JSON.parse(queryStr));

    this.query = this.query.find(JSON.parse(queryStr));
    //let query = Tour.find(JSON.parse(queryStr)); // retuns a query so we can chain other methods on it
    return this; // (returns whole object) so we can chain on this object
  }

  sort() {
    if (this.queryString.sort) {
      //console.log(this.queryString.sort);
      // sorting by several parameters
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt'); // default sorting
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      //query = query.select('name duration price') // seperated by space/ projecting
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // - for excluding fields
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1; // this or || default value
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit; // previous page * limit of results on each page

    // ?page2&limit=10 (1-10 page1), (11-20 page2)
    this.query = this.query.skip(skip).limit(limit); // skip amount of results before quering data (skip 10 to start with 11)

    return this;
  }
}
module.exports = APIFeatures;
