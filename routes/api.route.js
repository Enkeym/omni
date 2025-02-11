import { Router } from "express"

import { payment } from "../controllers/payment.controller.js"
import { registerTest } from "../controllers/register-test.controller.js"
import { register } from "../controllers/register.controller.js"
import { testWebhook } from "../controllers/test.controller.js"

const router = Router()

// Обработчик тестовой регистрации
router.post("/register-test*", registerTest)

// Обработчик реального регистрационного процесса
router.post("/register*", register)

// Обработчик платежей
router.post("/payment*", payment)

// Тестирование данных
router.post("/test*", testWebhook)

export default router
