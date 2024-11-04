const express = require("express");
const passport = require("passport");
const oauthServer = require("../../services/oauthService");
const authController = require("../../modules/auth/auth.controller");

const router = express.Router();

// Đăng nhập
router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  authController.postLogin
);

// Route xác thực OAuth2
router.post(
  "/authorize",
  oauthServer.authorization((clientId, redirectUri, done) => {
    // Xử lý xác thực client và lấy redirectUri
  }),
  (req, res) => {
    // Chuyển hướng tới redirectUri với authorization_code
  }
);
// Đăng ký
router.post("/register", authController.postRegister);
module.exports = router;
