import { Router } from "express"

import { payment } from "../controllers/payment.controller.js"
import { registerTest } from "../controllers/register-test.controller.js"
import { register } from "../controllers/register.controller.js"

const router = Router()

// Обработчик тестовой регистрации
router.post("/register-test*", registerTest)

// Обработчик реального регистрационного процесса
router.post("/register*", register)

// Обработчик платежей
router.post("/payment*", payment)

export default router
