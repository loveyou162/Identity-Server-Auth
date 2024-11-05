// Model người dùng
import UserModel from "../../models/user.model.js";

// Model client (nếu có)
import ClientModel from "../../models/oauthClient.model.js";
import bcrypt from "bcrypt";
// Model mã ủy quyền
import AuthorizationCode from "../../models/authorizeCode.model.js";
import crypto from "crypto";
// Thư viện JWT
import jwt from "jsonwebtoken";

import AuthCode from "../../models/authorizeCode.model.js";
const viewLogin = (req, res) => {
  let socialOption = req.query.with;
  if (socialOption) {
    return res.redirect(`/auth/${socialOption}`);
  }
  res.render("login");
};

const clientId = "YOUR_CLIENT_ID";
const clientSecret = "YOUR_CLIENT_SECRET";

const redirectUri = "http://localhost:3000/auth/oauth/callback";
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

    const hashedPassword = await bcrypt.hash(password, 10);
    // Tạo người dùng mới
    const newUser = new UserModel({
      username,
      password: hashedPassword,
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

const storeAuthorizationCode = async (
  code,
  clientId,
  userId,
  expiresIn = 15000
) => {
  const expirationTime = Date.now() + expiresIn * 1000; // Thời gian hết hạn
  const authorizationCode = new AuthCode({
    code,
    clientId,
    userId,
    expiresAt: expirationTime,
  });
  await authorizationCode.save();
};

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

    // Kiểm tra xem mã đã được sử dụng chưa
    if (authCode.used) {
      console.log("Mã xác thực đã được sử dụng trước đó");
      return { valid: false, message: "Code has already been used" };
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

const authCode = async (req, res) => {
  const { code } = req.body;
  console.log({ code });
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
    res.json({ access_token: newAccessToken, expires_in: 3600 });
  } catch (error) {
    console.log(error);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

// Đăng nhập người dùng
const postLogin = async (req, res) => {
  const user = req.user; // `req.user` sẽ được điền bởi passport nếu xác thực thành công
  console.log(49, user);
  const code = generateAuthorizationCode();
  storeAuthorizationCode(code, clientId, user._id);
  console.log(code);
  res.redirect(`http://localhost:3001/?code=${code}`);
};

// Endpoint để bắt đầu quy trình OAuth
export const authorizeCode = async (req, res) => {
  const scope = "email profile"; // Các quyền yêu cầu
  console.log(scope);
  const state = Math.random().toString(36).substring(7); // Tạo chuỗi ngẫu nhiên cho state

  const authUrl =
    `${authorizationServerUrl}/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}`;

  res.redirect(authUrl);
};

// Hàm callback để nhận mã xác thực và lấy token truy cập
const callback = async (req, res) => {
  const { code, state } = req.query;

  // Kiểm tra state nếu cần
  // TODO: So sánh state từ yêu cầu với giá trị đã lưu trữ để ngăn chặn CSRF

  try {
    // Xác thực mã xác thực
    const verificationResult = await verifyAuthorizationCode(code);

    if (!verificationResult.valid) {
      return res.status(400).json({ message: verificationResult.message });
    }

    // Nếu mã xác thực hợp lệ, lấy token truy cập từ máy chủ OAuth
    const response = await axios.post(
      `${authorizationServerUrl}/auth/oauth/token`,
      null,
      {
        params: {
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
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

export {
  postLogin,
  authorize,
  exchangeAuthorizationCodeForToken,
  postRegister,
  callback,
  viewLogin,
  refreshToken,
  authCode,
};
