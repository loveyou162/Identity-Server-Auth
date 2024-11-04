const mongoose = require("mongoose");

const oauthTokenSchema = new mongoose.Schema({
  accessToken: {
    type: String,
    unique: true,
    required: true,
  },
  refreshToken: {
    type: String,
    unique: true,
  },
  expiresIn: {
    type: Number,
    required: true,
  },
  scope: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  clientId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("OAuthToken", oauthTokenSchema);
