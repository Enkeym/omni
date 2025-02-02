import { createLogger } from "../utils/logger.js"

// Общий логгер для тестового контроллера
const logger = createLogger("TEST")

/**
 * Обрабатывает тестовый запрос (например, от вебхука Bitrix) и логирует входящие данные.
 * Данные могут передаваться через тело запроса, параметр query или непосредственно в URL.
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

    // Пытаемся получить данные из тела запроса или параметра query
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
    }

    // Если данные не найдены – пытаемся извлечь их из URL после "/test"
    if (!dataStr) {
      dataStr = decodeURIComponent(req.originalUrl).replace(/^\/test/, "")
      if (dataStr.startsWith("|")) {
        dataStr = dataStr.slice(1)
      }
      dataStr = dataStr.trim()
    }

    logger.debug("Исходное тело запроса:", dataStr)
    logger.debug("Тип данных запроса:", typeof dataStr)

    // Разбиваем строку на массив полей по разделителю "|", если данные присутствуют
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
