import mongoose from "mongoose";

const oauthClientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  clientId: {
    type: String,
    unique: true,
    required: true,
  },
  clientSecret: {
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

export default mongoose.model("OAuthClient", oauthClientSchema);
