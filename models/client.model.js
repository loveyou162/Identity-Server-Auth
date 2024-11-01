const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true,
    unique: true, // Đảm bảo mỗi clientId là duy nhất
  },
  clientSecret: {
    type: String,
    required: true,
  },
  redirectUri: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  // Các thuộc tính khác như loại client, trạng thái hoạt động, v.v.
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
