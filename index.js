import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import authRoutes from "./modules/auth/auth.route.js"; // Route xác thực
import dotenv from "dotenv"; // Đảm bảo bạn có thể sử dụng biến môi trường
import session from "express-session";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import "./config/passport.js";
import initWebRoutes from "./routes/web.js";
import userRouter from "./modules/user/user.routes.js";
import cors from "cors";
import clientRoutes from "./modules/config-client/client.route.js";
// Cấu hình dotenv để sử dụng biến môi trường
dotenv.config();

// Thiết lập __dirname để dùng với ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET, // Lấy giá trị từ biến môi trường
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.static("public"));

// Route để hiển thị trang đăng nhập
app.get("/authorize", (req, res) => {
  res.render("login");
});

const PORT = process.env.PORT || 3000; // Cổng cho Authorization Server
// Kết nối với MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected for Auth Server"))
  .catch((err) => console.log("MongoDB connection error:", err));
app.use(cors());

// Cấu hình middleware
app.use(morgan("dev"));
app.use(passport.initialize());
app.use(passport.session());

// Cấu hình EJS làm view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Sử dụng route xác thực

app.use("/api/auth", authRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/user", userRouter);
initWebRoutes(app);

// Khởi động server
app.listen(PORT, () => {
  console.log(`Authorization Server is running on http://localhost:${PORT}`);
});
