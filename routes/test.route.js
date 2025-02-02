// routes/test.route.js
import { Router } from "express"
import { testWebhook } from "../controllers/test.controller.js"

const router = Router()

// Используем wildcard, чтобы маршрут матчился со всеми URL, начинающимися с "/test"
router.post("/test*", testWebhook)

export default router
