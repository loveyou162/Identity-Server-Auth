import mongoose from "mongoose";

const authCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true,
  },
  clientId: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  used: {
    type: Boolean,
    default: false,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: "0" },
  },
});

export default mongoose.model("authorizeCode", authCodeSchema);
