import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import UserModel from "../models/user.model.js";
import jwt from "jsonwebtoken"; // Nhớ import jwt nếu bạn chưa làm

// Định nghĩa Local Strategy
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        // Find user by email
        const user = await UserModel.findOne({ email });
        if (!user) {
          return done(null, false, { message: "Email not found." });
        }

        // Check password
        const doMatch = await bcrypt.compare(password, user.password);
        if (!doMatch) {
          return done(null, false, { message: "Incorrect password." });
        }

        // Successful authentication
        return done(null, user);
      } catch (error) {
        console.error("Error during authentication:", error);
        return done(error); // Pass error to done callback
      }
    }
  )
);

export default passport;
