import bodyParser from "body-parser"
import dotenv from "dotenv" // Загружаем .env
import express from "express"
import helmet from "helmet"
import morgan from "morgan"

dotenv.config() // Загружаем переменные окружения

const port = process.env.PORT || 3434 // Используем 3434 по умолчанию

const app = express()

// Устанавливаем безопасные HTTP-заголовки
app.use(helmet())

// Логирование HTTP-запросов с помощью Morgan
app.use(morgan("combined"))

// Middleware для парсинга текстовых тел запросов
app.use(bodyParser.text({ type: "*/*" }))

// Если данные приходят в формате JSON
app.use(express.json())

import registerRouter from "./routes/register.route.js"
import testRouter from "./routes/test.route.js"

// Подключаем маршруты
app.use("/", registerRouter)
app.use("/", testRouter)

//Сообщение для проверки работы сервера
app.get("/", (req, res) => {
  res.send("Сервер работает!")
})

// Используем 0.0.0.0, чтобы сервер был доступен из внешней сети
app.listen(port, "0.0.0.0", () => {
  console.log(`Сервер запущен на порту ${port}`)
})
