
import express from "express";
import { viewLogin } from "../modules/auth/auth.controller.js";
const router = express.Router();

/**
 *
 * @param {*} app : express app
 */
const initWebRoutes = (app) => {

    router.get("/login", viewLogin);

    app.use(router);
}

export default initWebRoutes;
