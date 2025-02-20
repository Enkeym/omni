//index.js
import bodyParser from "body-parser"
import dotenv from "dotenv"
import express from "express"
import helmet from "helmet"
import morgan from "morgan"

import apiRouter from "./routes/api.route.js"

dotenv.config()

const port = process.env.PORT || 3434

const app = express()

// Устанавливаем безопасные HTTP-заголовки
app.use(helmet())

// Логирование HTTP-запросов с помощью Morgan
app.use(morgan("combined"))

// Middleware для парсинга текстовых тел запросов
app.use(bodyParser.text({ type: "*/*" }))

// Если данные приходят в формате JSON
app.use(express.json())

// Подключаем маршруты
app.use("/", apiRouter)

//Сообщение для проверки работы сервера
app.get("/", (res) => {
  res.send("Сервер работает!")
})

// Используем 0.0.0.0, чтобы сервер был доступен из внешней сети
app.listen(port, "0.0.0.0", () => {
  console.log(`Сервер запущен на порту ${port}`)
})
