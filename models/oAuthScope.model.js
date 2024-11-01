const oauthScopeSchema = new mongoose.Schema({
  scope: {
    type: String,
    unique: true,
    required: true,
  },
  description: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("OAuthScope", oauthScopeSchema);
