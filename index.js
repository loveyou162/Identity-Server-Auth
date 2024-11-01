const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const authRoutes = require('./modules/auth/auth.route'); // Route xác thực
require('dotenv').config(); // Đảm bảo bạn có thể sử dụng biến môi trường
const session = require('express-session');
require('./config/passport');
const morgan = require('morgan');


const app = express();
app.use(session({
  secret: process.env.SESSION_SECRET, // Lấy giá trị từ biến môi trường
  resave: false,
  saveUninitialized: false,
}));
const PORT = process.env.PORT || 3000; // Cổng cho Authorization Server

// Kết nối với MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for Auth Server'))
  .catch(err => console.log(err));
  
app.use(express.urlencoded({ extended: true }));
// Middleware để phân tích dữ liệu JSON
app.use(morgan('dev')); 
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());


// Sử dụng route xác thực
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Authorization Server is running on http://localhost:${PORT}`);
});
