// index.js
import bodyParser from "body-parser"
import express from "express"
import helmet from "helmet"
import morgan from "morgan"
import { port } from "./config.js"
import registerRouter from "./routes/register.route.js"
import testRouter from "./routes/test.route.js"

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
app.use("/", registerRouter)
app.use("/", testRouter)

//Сообщение для проверки работы сервера
app.get("/", (req, res) => {
  res.send("Сервер работает!")
})

app.listen(port, "0.0.0.0", () => {
  console.log(`Сервер запущен на порту ${port}`)
})
