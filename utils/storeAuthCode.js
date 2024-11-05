import AuthCode from "../models/authorizeCode.model.js";
import crypto from "crypto";

function generateAuthorizationCode() {
  return crypto.randomBytes(20).toString("hex"); // Tạo mã ngẫu nhiên 40 ký tự
}

async function storeAuthorizationCode(code, clientId, userId, expiresIn = 300) {
  const expirationTime = Date.now() + expiresIn * 1000; // Thời gian hết hạn
  const authorizationCode = new AuthCode({
    code,
    clientId,
    userId,
    expiresAt: expirationTime,
  });
  await authorizationCode.save();
}
// Xác minh mã
function verifyAuthorizationCode(code) {
  const data = authorizationCodes[code];

  if (!data) {
    return { valid: false, message: "Invalid code" };
  }

  if (Date.now() > data.expirationTime) {
    delete authorizationCodes[code]; // Xóa mã hết hạn
    return { valid: false, message: "Code expired" };
  }

  // Đảm bảo mã chỉ được sử dụng một lần
  delete authorizationCodes[code];
  return { valid: true, userId: data.userId };
}

export const authCode = (req, res) => {
  const { code, client_id } = req.body;
  const verificationResult = verifyAuthorizationCode(code);

  if (!verificationResult.valid) {
    return res.status(400).json({ message: verificationResult.message });
  }

  // Tạo access token (sử dụng JWT hoặc một cách khác)
  const accessToken = crypto.randomBytes(30).toString("hex"); // Tạo mã token ngẫu nhiên
  res.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
  });
};
