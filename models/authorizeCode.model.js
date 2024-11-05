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
  },
});
// Tạo một chỉ mục TTL dựa trên thuộc tính expiresAt
authCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("authorizeCode", authCodeSchema);
