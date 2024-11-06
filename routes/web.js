
import express from "express";
import { viewLogin } from "../modules/auth/auth.controller.js";
const router = express.Router();

/**
 *
 * @param {*} app : express app
 */
const initWebRoutes = (app) => {
    app.use(router);
}

export default initWebRoutes;
