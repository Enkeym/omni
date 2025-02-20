import { Router } from "express"

import { payment } from "../controllers/payment.controller.js"
import { registerTest } from "../controllers/register-test.controller.js"
import { register } from "../controllers/register.controller.js"

const router = Router()

router.post("/register-test*", registerTest)

router.post("/register*", register)

router.post("/payment*", payment)

export default router
