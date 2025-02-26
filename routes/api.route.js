import { Router } from "express"

import { payment } from "../controllers/payment.controller.js"
import { register } from "../controllers/register.controller.js"
import { testUsers } from "../controllers/testUser.controller.js"

const router = Router()

router.post("/register*", register)

router.post("/payment*", payment)

router.get("/test-users*", testUsers)

export default router
