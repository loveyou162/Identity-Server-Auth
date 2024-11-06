import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import UserModel from "../models/user.model.js";
import jwt from "jsonwebtoken"; // Nhớ import jwt nếu bạn chưa làm

// Định nghĩa Local Strategy
passport.use(
  new LocalStrategy(
    { usernameField: "username", passwordField: "password" }, // Chỉ định tên trường
    async (username, password, done) => {
        console.log(username,password);
      try {
        // Tìm người dùng theo username
        const user = await UserModel.findOne({ username });
        console.log(user.password);
        // Nếu không tìm thấy người dùng, trả về thông báo
        if (!user) {
          return done(null, false, { message: "Incorrect credentials." });
        }
        console.log("ok có user");
        // So sánh mật khẩu
        const doMatch = await bcrypt.compare(password, user.password);
        console.log(doMatch);
        if (!doMatch) {
          return done(null, false, { message: "Incorrect credentials." });
        }

        console.log("User authenticated successfully.");
        return done(null, user); // Đăng nhập thành công
      } catch (error) {
        console.error("Error during authentication:", error);
        return done(error); // Xử lý lỗi
      }
    }
  )
);

export default passport;
