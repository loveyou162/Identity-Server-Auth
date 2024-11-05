import express from "express";
import passport from "passport";
import oauthServer from "../../services/oauthService.js";
import {
  postLogin,
  authorizeCode,
  authorize,
  exchangeAuthorizationCodeForToken,
  postRegister,
  callback,
  authCode,
} from "../../modules/auth/auth.controller.js";

const router = express.Router();

// Đăng nhập
router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  postLogin
);

router.post("/oauth/token", authCode);

// Đăng ký
router.post("/register", postRegister);
router.post("/oauth/authorize", authorizeCode);
router.post("/oauth/callback", callback);

export default router;
