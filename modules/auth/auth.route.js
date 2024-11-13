import express from "express";
import passport from "passport";
import {
  postLogin,
  authorizeCode,
  refreshToken,
  postRegister,
  callback,
  authCode,
  protectedRoutes,
  postLogout,
} from "./auth.controller.js";

const router = express.Router();

// Đăng nhập
router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      // Send server error as JSON
      return res.status(500).json({ error: "Server error during login." });
    }
    if (!user) {
      // Send authentication error as JSON
      return res
        .status(401)
        .json({ error: info.message || "Authentication failed" });
    }

    // Proceed to postLogin if authentication is successful
    req.user = user;
    postLogin(req, res);
  })(req, res, next);
});

router.post("/oauth/token", authCode);
router.post("/oauth/refreshToken", protectedRoutes, refreshToken);

// Đăng ký
router.post("/register", postRegister);
router.post("/oauth/authorize", authorizeCode);
router.post("/oauth/callback", callback);
router.post("/oauth/logout", protectedRoutes, postLogout);

export default router;
