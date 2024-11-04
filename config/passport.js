import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import UserModel from "../models/user.model.js";

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await UserModel.findOne({ username });
      if (!user || !(await user.comparePassword(password))) {
        return done(null, false, { message: "Incorrect credentials." });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

export default passport;
