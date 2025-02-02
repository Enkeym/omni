// controllers/test.controller.js

import { createLogger } from "../utils/logger.js"

const logger = createLogger("TEST")

/**
 * Обрабатывает тестовый запрос (например, от вебхука Bitrix) и логирует входящие данные.
 * Данные могут передаваться через тело запроса, параметр query (data)
 * или напрямую в URL ("/test|...").
 */
export const testWebhook = async (req, res) => {
  try {
    logger.info("Получен тестовый запрос для вебхука Bitrix")

    // Логирование заголовков запроса (для отладки)
    const headersStr = JSON.stringify(req.headers, null, 2)
    logger.debug("Заголовки запроса:", headersStr)

    // 1. Пытаемся получить данные из тела или query
    let dataStr = ""
    if (typeof req.body === "string" && req.body.trim()) {
      dataStr = req.body.trim()
    } else if (
      req.query.data &&
      typeof req.query.data === "string" &&
      req.query.data.trim()
    ) {
      dataStr = req.query.data.trim()
    } else if (
      typeof req.body === "object" &&
      Object.keys(req.body).length > 0
    ) {
      // Если тело пришло в JSON или объектном виде — сериализуем
      dataStr = JSON.stringify(req.body)
    }

    // 2. Если строка всё ещё пустая, пытаемся достать из URL
    // Например, если запрос: "/test|field1|field2|..."
    if (!dataStr) {
      dataStr = decodeURIComponent(req.originalUrl).replace(/^\/test/, "")
      if (dataStr.startsWith("|")) {
        dataStr = dataStr.slice(1) // убираем ведущий символ "|"
      }
      dataStr = dataStr.trim()
      logger.debug("Извлечённые из URL данные:", dataStr)
    }

    // 3. Логируем, что получилось
    logger.debug("Исходное тело запроса:", dataStr)
    logger.debug("Тип данных запроса:", typeof dataStr)

    // 4. Разбиваем строку на массив по "|", если dataStr не пустая
    let fields = []
    if (dataStr) {
      fields = dataStr.split("|")
      logger.debug("Разбитые поля:", JSON.stringify(fields, null, 2))
    }

    // 5. Формируем ответ
    res.status(200).json({
      message: "Данные вебхука успешно получены и залогированы",
      headers: req.headers,
      body: dataStr,
      dataType: typeof dataStr,
      fields
    })
  } catch (error) {
    logger.error("Ошибка при обработке тестового запроса:", error.message)
    res.status(500).send("Внутренняя ошибка сервера")
  }
}
