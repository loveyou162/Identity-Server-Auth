import mongoose from "mongoose";
const oauthEndpointSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true,
  },
  endpointUrl: {
    type: String,
    required: true,
  },
  method: {
    type: String,
    enum: ["GET", "POST", "PUT", "DELETE"],
    required: true,
  },
  description: {
    type: String,
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

export default mongoose.model("OAuthEndpoint", oauthEndpointSchema);
