import { Router } from "express"
import { register } from "../controllers/register.controller.js"

const router = Router()

// Любые запросы, начинающиеся с "/register", пойдут в контроллер.
// Важно: именно "/register*", а не "/register"
router.post("/register*", register)

export default router
