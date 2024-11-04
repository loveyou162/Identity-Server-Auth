import express from "express";
import passport from "passport";
import oauthServer from "../../services/oauthService.js";
import {
  postLogin,
  authorize,
  exchangeAuthorizationCodeForToken,
  postRegister,
} from "../../modules/auth/auth.controller.js";

const router = express.Router();

// Đăng nhập
router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  postLogin
);

// Đăng ký
router.post("/register", postRegister);

export default router;
