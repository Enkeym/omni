// routes/test.route.js
import { Router } from "express"

import { testWebhook } from "../controllers/test.controller.js"

const router = Router()

router.post("/test*", testWebhook)

export default router
