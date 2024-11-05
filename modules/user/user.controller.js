import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { deleteOne } from "../../handlers/factor.js";
import { ApiFeatures } from "../../utils/ApiFeatures.js";
import userModel from "../../models/user.model.js";
import bcrypt from "bcrypt";

const addUser = catchAsyncError(async (req, res, next) => {
  console.log(req.body);
  const addUser = new userModel(req.body);
  await addUser.save();

  res.status(201).json({ message: "success", addUser });
});

const getAllUsers = catchAsyncError(async (req, res, next) => {
  let apiFeature = new ApiFeatures(userModel.find(), req.query)
    .pagination()
    .fields()
    .filteration()
    .search()
    .sort();
  const PAGE_NUMBER = apiFeature.queryString.page * 1 || 1;
  const getAllUsers = await apiFeature.mongooseQuery;

  res.status(201).json({ page: PAGE_NUMBER, message: "success", getAllUsers });
});

const updateUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const updateUser = await userModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  updateUser && res.status(201).json({ message: "success", updateUser });

  !updateUser && next(new AppError("User was not found", 404));
});

const changeUserPassword = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  req.body.passwordChangedAt = Date.now();
  console.log(req.body.passwordChangedAt);
  const changeUserPassword = await userModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  changeUserPassword &&
    res.status(201).json({ message: "success", changeUserPassword });

  !changeUserPassword && next(new AppError("User was not found", 404));
});
const deleteUser = deleteOne(userModel, "user");

export const createUser = async (githubUser) => {
  try {
    const existingUser = await userModel.findOne({
      authSocialId: githubUser.id,
    });

    if (existingUser) {
      console.log("Người dùng đã tồn tại, đăng nhập thay vì tạo tài khoản.");
      return existingUser;
    }
    const newUser = fillDataUser(githubUser);
    const savedUser = await newUser.save();
    console.log("Đã tạo mới user github.");
    return savedUser;
  } catch (error) {
    console.error("Error creating or finding user:", error);
    throw new Error("Unable to create or find user");
  }
};

export const fillDataUser = (githubUser) => {
  return new userModel({
    name: githubUser.name || githubUser.login,
    email: `${githubUser.id}@gmail.com`,
    authSocialId: githubUser.id,
    authType: "github",
    picture: githubUser.avatar_url,
    isActive: true,
    email_verified: false,
  });
};

export { addUser, getAllUsers, updateUser, deleteUser, changeUserPassword };
