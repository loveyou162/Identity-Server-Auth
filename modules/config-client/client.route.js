import express from 'express'
import * as clientController from './client.controller.js'
 
const router = express.Router();
router.post('/register-client', clientController.registerClient
)

export default router;