import express from "express";
import * as clientController from "./client.controller.js";
import * as auth from "../auth/auth.controller.js";
import { allowedTo } from "../../middleware/auth.js";

const router = express.Router();
router.post(
  "/register-client",
  // ,allowedTo("admin")
  auth.protectedRoutes,
  clientController.registerClient
);

export default router;
