// Model người dùng
import UserModel from "../../models/user.model.js";

// Model client (nếu có)
import ClientModel from "../../models/oauthClient.model.js";

// Model mã ủy quyền
import AuthorizationCode from "../../models/oAuthToken.model.js";

// Thư viện JWT
import jwt from "jsonwebtoken";

// Đăng ký
const postRegister = async (req, res) => {
  const { username, password, email, fullName, provider } = req.body;
  console.log({ username, password, email, fullName, provider });

  try {
    // Kiểm tra xem người dùng đã tồn tại chưa
    const existingUser = await User.findOne({ where: { email } });
    console.log(14, existingUser);
    if (existingUser) {
      return res.status(400).send({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt;

    // Tạo người dùng mới
    const newUser = await new UserModel({ username, password }); // Mật khẩu cần được mã hóa trước khi lưu
    res.status(201).send({
      message: "User registered successfully",
      user: { _id: newUser.id, username: newUser.username },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error registering user" });
  }
};

// Đăng nhập người dùng
const postLogin = async (req, res) => {
  const user = req.user;
  console.log(req.user);

  // Tạo Access Token
  const accessToken = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  // Gửi token và thông tin người dùng về client
  return res.status(200).json({
    message: "Login successful",
    accessToken: accessToken,
    user: {
      id: user._id,
      username: user.username,
      // Bạn có thể thêm thông tin khác nếu cần
    },
  });
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

// Hàm tạo mã ngẫu nhiên
const generateRandomCode = () => {
  return Math.random().toString(36).substr(2, 8); // Tạo mã ngẫu nhiên
};

export {
  postLogin,
  authorize,
  exchangeAuthorizationCodeForToken,
  postRegister,
};
