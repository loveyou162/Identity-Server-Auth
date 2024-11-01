const oauthClientSchema = new mongoose.Schema({
  clientId: {
    type: String,
    unique: true,
    required: true,
  },
  clientSecret: {
    type: String,
    required: true,
  },
  clientName: {
    type: String,
    required: true,
  },
  redirectUri: {
    type: String,
    required: true,
  },
  grantTypes: {
    type: [String],
    enum: ["authorization_code", "implicit", "password", "client_credentials"],
    default: ["authorization_code"],
  },
  scope: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("OAuthClient", oauthClientSchema);
