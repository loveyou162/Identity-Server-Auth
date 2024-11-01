const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) return res.sendStatus(401); // Nếu không có token, trả về lỗi 401

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Nếu token không hợp lệ, trả về lỗi 403
    req.user = user; // Gán thông tin người dùng vào request
    next(); // Tiếp tục đến middleware tiếp theo
  });
};

module.exports = authenticateJWT;
