import { Router } from "express"

import { payment } from "../controllers/payment.controller.js"
import { register } from "../controllers/register.controller.js"

const router = Router()

router.post("/register*", register)

router.post("/payment*", payment)

export default router
