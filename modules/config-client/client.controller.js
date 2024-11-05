import crypto from "crypto";
import Client from "../../models/oauthClient.model.js";

// Hàm tạo chuỗi ngẫu nhiên
const generateRandomString = (length) =>
  crypto.randomBytes(length).toString("hex");

// Đăng ký client
const registerClient = async (req, res) => {
  const { name, redirectUri, scope, grantTypes } = req.body;
  console.log({ name, redirectUri, scope, grantTypes });
  const clientId = generateRandomString(16); // 32 ký tự hex
  const clientSecret = generateRandomString(32); // 64 ký tự hex

  const client = new Client({
    name,
    clientId,
    clientSecret,
    redirectUri,
    grantTypes,
    scope,
  });
  await client.save();

  res.json({ clientId, clientSecret, redirectUri });
};
export { registerClient };
