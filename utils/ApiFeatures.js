export class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  //1- Pagination
  pagination() {
    const limit = this.queryString.limit * 1 || 10;
    let page = this.queryString.page * 1 || 1;
    if (this.queryString.page <= 0) page = 1;
    const skip = (page - 1) * limit;
    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    return this;
  }
  //2- Filteration
  filteration() {
    let filterObj = { ...this.queryString };

    let excludedQuery = ["page", "sort", "fields", "keyword"];

    excludedQuery.forEach((ele) => {
      delete filterObj[ele];
    });
    filterObj = JSON.stringify(filterObj);

    filterObj = filterObj.replace(
      /\b(gt|gte|lt|lte)\b/g,
      (match) => `$${match}`
    );
    filterObj = JSON.parse(filterObj);

    this.mongooseQuery.find(filterObj);
    return this;
  }

  //3- Sort
  sort() {
    if (this.queryString.sort) {
      let sortedBy = this.queryString.sort.split(",").join(" ");
      this.mongooseQuery.sort(sortedBy);
    } else {
      // Sắp xếp mặc định theo `createdAt` giảm dần nếu không có yêu cầu sắp xếp
      this.mongooseQuery.sort("-createdAt");
    }
    return this;
  }

  //4- Search
  search() {
    if (this.queryString.keyword) {
      this.mongooseQuery.find({
        $or: [
          { title: { $regex: this.queryString.keyword, $options: "i" } },
          { descripton: { $regex: this.queryString.keyword, $options: "i" } },
        ],
      });
    }
    return this;
  }

  //5- Fields
  fields() {
    if (this.queryString.fields) {
      let fields = this.queryString.fields.split(",").join(" ");
      this.mongooseQuery.select(fields); // Sửa để thực hiện lựa chọn trường
    }
    return this;
  }
}
