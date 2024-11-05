import express from 'express'
import * as clientController from './client.controller.js'
import {allowedTo} from '../../middleware/auth.js'
 
const router = express.Router();
router.post('/register-client'
    ,allowedTo("admin")
    ,clientController.registerClient
)

export default router;