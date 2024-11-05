import jwt from "jsonwebtoken";
import {catchAsyncError} from "../utils/catchAsyncError.js"

const authenticateJWT = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) return res.sendStatus(401); // Nếu không có token, trả về lỗi 401

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Nếu token không hợp lệ, trả về lỗi 403
    req.user = user; // Gán thông tin người dùng vào request
    next(); // Tiếp tục đến middleware tiếp theo
  });
};

const allowedTo = (...roles) => {
  return catchAsyncError(async (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError(
          `You are not authorized to access this route. Your are ${req.user.role}`,
          401
        )
      );
    next();
  });
};


export { authenticateJWT ,allowedTo};
