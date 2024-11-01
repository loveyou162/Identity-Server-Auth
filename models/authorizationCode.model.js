const mongoose = require('mongoose');

const authorizationCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true, // Mã xác thực phải là duy nhất
  },
  clientId: {
    type: String,
    required: true,
  },
  redirectUri: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Liên kết tới model User
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true, // Tự động thêm trường createdAt và updatedAt
});

// Tạo model từ schema
const AuthorizationCode = mongoose.model('AuthorizationCode', authorizationCodeSchema);

module.exports = AuthorizationCode;
