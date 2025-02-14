import { Router } from "express"

import { registerTest } from "../controllers/register-test.controller.js"

const router = Router()

router.post("/register-test*", registerTest)

//router.post("/register*", register)

export default router
