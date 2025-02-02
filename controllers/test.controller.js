// controllers/test.controller.js
import { createLogger } from "../utils/logger.js"

//Общий штамп для логов
const logger = createLogger("TEST")

/**
 * Обрабатывает тестовый запрос (например, от вебхука Bitrix) и логирует входящие данные.
 * Данные могут передаваться через тело запроса или в URL (например, в параметре data).
 *
 * @param {object} req - Объект запроса Express.
 * @param {object} res - Объект ответа Express.
 */

export const testWebhook = async (req, res) => {
  try {
    logger.info("Получен тестовый запрос для вебхука Bitrix")

    // Логирование заголовков запроса
    const headersStr = JSON.stringify(req.headers, null, 2)
    logger.debug("Заголовки запроса:", headersStr)

    // Получаем данные запроса из тела или из параметра URL (например, req.query.data)
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
      // Если тело запроса пришло в виде объекта – сериализуем его
      dataStr = JSON.stringify(req.body)
    } else {
      logger.warn("Нет данных для обработки")
    }

    logger.debug("Исходное тело запроса:", dataStr)
    logger.debug("Тип данных запроса:", typeof dataStr)

    // Разбиваем строку на массив полей, если данные присутствуют
    let fields = []
    if (dataStr) {
      fields = dataStr.split("|")
      logger.debug("Разбитые поля:", JSON.stringify(fields, null, 2))
    } else {
      logger.debug("Данных для разбития не получено")
    }

    // Отправляем ответ клиенту
    res.status(200).json({
      message: "Данные вебхука успешно получены и залогированы",
      headers: req.headers,
      body: dataStr,
      dataType: typeof dataStr,
      fields: fields
    })
  } catch (error) {
    logger.error("Ошибка при обработке тестового запроса:", error.message)
    res.status(500).send("Внутренняя ошибка сервера")
  }
}
