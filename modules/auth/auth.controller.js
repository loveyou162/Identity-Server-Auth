// Model người dùng
import UserModel from "../../models/user.model.js";

// Model client (nếu có)
import ClientModel from "../../models/oauthClient.model.js";
// Model mã ủy quyền
import AuthorizationCode from "../../models/authorizeCode.model.js";
import crypto from "crypto";
// Thư viện JWT
import jwt from "jsonwebtoken";
import axios from "axios";

import AuthCode from "../../models/authorizeCode.model.js";
import { log } from "console";
const viewLogin = (req, res) => {
  res.render("login");
};

// const clientId = "YOUR_CLIENT_ID";
const clientSecret = "YOUR_CLIENT_SECRET";

// const redirectUri = "http://localhost:3000/auth/oauth/callback";
const authorizationServerUrl = "http://localhost:3000";

//tạo access token
const generateAccessToken = (data) => {
  return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "1h" });
};

//tạo refresh token
const generateRefreshToken = (data) => {
  return jwt.sign(data, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

//tạo code
function generateAuthorizationCode() {
  return crypto.randomBytes(20).toString("hex"); // Tạo mã ngẫu nhiên 40 ký tự
}

// Đăng ký
const postRegister = async (req, res) => {
  const { username, password, email, fullName, provider } = req.body;
  // console.log({ username, password, email, fullName, provider });

  try {
    // Kiểm tra xem người dùng đã tồn tại chưa
    const existingUser = await UserModel.findOne({ email });
    console.log(14, existingUser);
    if (existingUser) {
      return res.status(400).send({ message: "User already exists" });
    }

    // Tạo người dùng mới
    const newUser = new UserModel({
      username,
      password,
      email,
      fullName,
    });
    await newUser.save();
    res.status(201).send({
      message: "User registered successfully",
      user: { _id: newUser.id, username: newUser.username },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error registering user" });
  }
};

const storeAuthorizationCode = async (code, clientId, userId, expiresIn) => {
  const expirationTime = Date.now() + expiresIn * 1000; // Thời gian hết hạn
  const authorizationCode = new AuthCode({
    code,
    clientId,
    userId,
    expiresAt: expirationTime,
  });
  await authorizationCode.save();
};

//method xác thực code
const verifyAuthorizationCode = async (code) => {
  try {
    // Tìm mã xác thực trong cơ sở dữ liệu
    const authCode = await AuthCode.findOne({ code });

    if (!authCode) {
      return { valid: false, message: "Invalid code" };
    }

    // Kiểm tra xem mã đã hết hạn chưa
    if (Date.now() > authCode.expiresAt) {
      console.log("Mã xác thực đã hết hạn và sẽ được xóa");
      await AuthCode.deleteOne({ code }); // Xóa mã hết hạn
      return { valid: false, message: "Code expired" };
    }

    // Đánh dấu mã là đã sử dụng
    await AuthCode.updateOne({ code }, { used: true });
    console.log("Mã xác thực đã được xác nhận và đánh dấu là đã sử dụng");

    return { valid: true, userId: authCode.userId };
  } catch (error) {
    console.error("Lỗi xác thực mã xác thực:", error);
    return { valid: false, message: "Internal server error" };
  }
};

const refreshToken = async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ message: "Refresh token is required" });
  }
  try {
    // Xác thực Refresh Token
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const user = await UserModel.findById(decoded.userId);

    // Kiểm tra Refresh Token trong cơ sở dữ liệu
    if (!user || user.refreshToken !== refresh_token) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
    // Tạo JWT cho người dùng
    const tokenPayload = {
      userId: user._id, // Sử dụng userId thực tế
      email: user.email, // Có thể thêm thông tin khác nếu cần
    };
    // Tạo Access Token mới
    const newAccessToken = generateAccessToken(tokenPayload);
    user.accessToken = newAccessToken;
    await user.save();

    res.json({ access_token: newAccessToken, expires_in: 3600 });
  } catch (error) {
    console.log(error);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

//bước1 Endpoint để bắt đầu quy trình OAuth
// /api/auth/oauth/authorize
const authorizeCode = async (req, res) => {
  const scope = "email profile";
  const { clientId, redirectUri } = req.body; // Các quyền yêu cầu
  const state = Math.random().toString(36).substring(7); // Tạo chuỗi ngẫu nhiên cho state

  // Kiểm tra xem client có hợp lệ không
  const client = await ClientModel.findOne({ clientId });
  console.log(client);
  if (!client || client.redirectUri !== redirectUri) {
    return res.status(400).json({ message: "Invalid client or redirect URI" });
  }

  const authUrl =
    `${authorizationServerUrl}/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}`;

   res.redirect(authUrl);
};

//bước 2 Đăng nhập người dùng
// /api/auth/login
const postLogin = async (req, res) => {
  const user = req.user;
  const { clientId } = req.body;
  // `req.user` sẽ được điền bởi passport nếu xác thực thành công
  console.log(49, user);
  const Client = await ClientModel.findOne({ clientId });
  console.log({ Client });

  const code = generateAuthorizationCode();
  storeAuthorizationCode(code, clientId, user._id, 20);
  console.log(code);
  res.json({ redirectUrl: `${Client.redirectUri}?code=${code}` });
};

//bước 3 Hàm callback để nhận mã xác thực và lấy token truy cập
// /api/auth/oauth/callback
const callback = async (req, res) => {
  const { code, state } = req.body;
  console.log(code);
  // Kiểm tra state nếu cần
  // TODO: So sánh state từ yêu cầu với giá trị đã lưu trữ để ngăn chặn CSRF

  try {
    // Xác thực mã xác thực
    const verificationResult = await verifyAuthorizationCode(code);
    console.log({ verificationResult });
    if (!verificationResult.valid) {
      return res.status(400).json({ message: verificationResult.message });
    }

    const authCode = await AuthCode.findOne({ code });
    const Client = await ClientModel.findOne({ clientId: authCode.clientId });
    console.log(Client);

    // Nếu mã xác thực hợp lệ, lấy token truy cập từ máy chủ OAuth
    const response = await axios.post(
      `${authorizationServerUrl}/api/auth/oauth/token`,
      { code },
      {
        headers: {
          "Content-Type": "application/json", // Đảm bảo định dạng dữ liệu là JSON
          // Authorization: `Basic ${Buffer.from(
          //   `${clientId}:${clientSecret}`
          // ).toString("base64")}`, // Nếu cần sử dụng Basic Auth
          // Bạn có thể thêm các header khác nếu cần
        },
        params: {
          code,
          grant_type: "authorization_code", //change
          redirect_uri: Client.redirectUri, //change
          client_id: Client.clientId, //change
          client_secret: clientSecret, //change
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    // Xử lý token (lưu vào cơ sở dữ liệu, phiên người dùng, v.v.)
    // TODO: Lưu token vào cơ sở dữ liệu hoặc phiên người dùng theo nhu cầu
    res.json({
      access_token,
      refresh_token,
      expires_in,
    });
  } catch (error) {
    console.error("Error getting access token:", error);
    res.status(500).send("Error getting access token");
  }
};

//bước 4
// /api/auth/oauth/token
const authCode = async (req, res) => {
  const { code } = req.body;
  console.log(129, { code });
  // Xác thực mã xác thực
  const verificationResult = await verifyAuthorizationCode(code);

  if (!verificationResult.valid) {
    return res.status(400).json({ message: verificationResult.message });
  }

  try {
    // Tìm thông tin người dùng dựa trên mã xác thực
    const authCodeData = await AuthCode.findOne({
      userId: verificationResult.userId,
    });
    console.log(authCodeData);
    if (!authCodeData) {
      return res
        .status(400)
        .json({ message: "Invalid code or user not found." });
    }

    // Tìm người dùng dựa trên userId
    const user = await UserModel.findById(authCodeData.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Tạo JWT cho người dùng
    const tokenPayload = {
      userId: user._id, // Sử dụng userId thực tế
      email: user.email, // Có thể thêm thông tin khác nếu cần
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    user.accessToken = accessToken;
    // Lưu Refresh Token vào cơ sở dữ liệu hoặc bộ nhớ
    user.refreshToken = refreshToken;
    await user.save();
    // Xử lý token (lưu vào cơ sở dữ liệu, phiên người dùng, v.v.)
    res.json({
      access_token: accessToken,
      refresh_token: refreshToken, // Nếu không sử dụng refresh token, có thể để null
      expires_in: 3600, // Thời gian hết hạn của token tính bằng giây
    });
  } catch (error) {
    console.error("Error getting access token:", error);
    res.status(500).send("Error getting access token");
  }
};
/////////////////////////////////
// Cấp mã ủy quyền (Authorization Code)
const authorize = async (req, res) => {
  const { clientId, redirectUri } = req.body;

  // Kiểm tra xem client có hợp lệ không
  const client = await Client.findOne({ clientId });
  if (!client || client.redirectUri !== redirectUri) {
    return res.status(400).send("Invalid client or redirect URI");
  }

  // Kiểm tra xem người dùng có xác thực không
  if (!req.user) {
    return res.status(401).send("User not authenticated");
  }

  // Tạo mã ủy quyền
  const authorizationCode = new AuthorizationCode({
    code: generateRandomCode(), // Hàm tạo mã ngẫu nhiên
    clientId: clientId,
    userId: req.user._id,
    redirectUri: redirectUri,
    expiresAt: new Date(Date.now() + 1000 * 60 * 10), // Hết hạn sau 10 phút
  });

  await authorizationCode.save();

  // Chuyển hướng đến redirect URI với mã ủy quyền
  res.redirect(`${redirectUri}?code=${authorizationCode.code}`);
};

// Tạo mã token từ authorization code
const exchangeAuthorizationCodeForToken = async (req, res) => {
  const { code, clientId, clientSecret } = req.body;

  try {
    // Lấy mã ủy quyền
    const authCode = await AuthorizationCode.findOne({ code });
    if (!authCode) {
      return res.status(400).send("Invalid authorization code");
    }

    // Kiểm tra client
    const client = await Client.findOne({ clientId, clientSecret });
    if (!client) {
      return res.status(400).send("Invalid client credentials");
    }

    // Kiểm tra xem mã ủy quyền có hết hạn không
    if (new Date() > authCode.expiresAt) {
      return res.status(400).send("Authorization code has expired");
    }

    // Tạo Access Token
    const accessToken = jwt.sign(
      { id: authCode.userId, clientId: authCode.clientId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ accessToken });
  } catch (error) {
    res
      .status(500)
      .send("Error exchanging authorization code for token: " + error.message);
  }
};
const protectedRoutes = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // Kiểm tra xem header authorization có tồn tại hay không
  if (!authHeader) {
    return res.status(401).json({ message: "Bạn cần đăng nhập" });
  }

  // Lấy token từ header
  const token = authHeader.split(" ")[1];

  // Xác thực token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token không hợp lệ" });
    }
    req.user = user.user; // Giả sử token chứa thông tin user
    next();
  });
};
export {
  postLogin,
  postRegister,
  callback,
  viewLogin,
  refreshToken,
  authCode,
  authorizeCode,
  protectedRoutes,
};
