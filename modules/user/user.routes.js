import express from "express";
import * as User from "./user.controller.js";



const userRouter = express.Router();

userRouter
  .route("/")
  .post(User.addUser)
  .get(User.getAllUsers);

userRouter
  .route("/:id")
  .put( User.updateUser)
  .delete(User.deleteUser)
  .patch(User.changeUserPassword);

export default userRouter;
