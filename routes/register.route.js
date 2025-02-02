// routes/register.route.js
import { Router } from "express"
import { register } from "../controllers/register.controller.js"

const router = Router()

// Используем wildcard, чтобы маршрут матчился со всеми URL, начинающимися с "/register"
router.post("/register*", register)

export default router
