import express from "express";
import passport from "passport";
import {
  postLogin,
  authorizeCode,
  refreshToken,
  postRegister,
  callback,
  authCode,
} from "./auth.controller.js";

const router = express.Router();

// Đăng nhập
router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  postLogin
);

router.post("/oauth/token", authCode);
router.post("/oauth/refreshToken", refreshToken);

// Đăng ký
router.post("/register", postRegister);
router.post("/oauth/authorize", authorizeCode);
router.post("/oauth/callback", callback);

export default router;
