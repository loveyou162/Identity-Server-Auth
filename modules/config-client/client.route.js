import express from "express";
import * as clientController from "./client.controller.js";
import * as auth from "../auth/auth.controller.js";
import { allowedTo } from "../../middleware/auth.js";

const router = express.Router();
router
  .route("/")
  .post(
    //allowedTo("admin"),
    auth.protectedRoutes,
    clientController.registerClient
  )
  .get(clientController.getAll);

router
  .route("/:id")
  .put(clientController.updateConfigClient)
  .get(clientController.getIdConfig)
  .delete(clientController.deleteConfigClient);
export default router;
