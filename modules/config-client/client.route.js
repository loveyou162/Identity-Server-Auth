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
  .get(auth.protectedRoutes, clientController.getAll);

router
  .route("/:id")
  .put(auth.protectedRoutes, clientController.updateConfigClient)
  .get(auth.protectedRoutes, clientController.getIdConfig)
  .delete(auth.protectedRoutes, clientController.deleteConfigClient);

router.get("/get-client/:clientId", clientController.getClientIdConfig);
export default router;
