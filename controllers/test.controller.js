import { createLogger } from "../utils/logger.js"

const logger = createLogger("TEST")

/**
 * Обрабатывает тестовый запрос (например, от вебхука Bitrix) и логирует входящие данные.
 * Полностью игнорирует служебные данные в теле, берёт строку только из URL:
 * "/test|field1|field2|...".
 */
export const testWebhook = async (req, res) => {
  try {
    logger.info("Получен тестовый запрос для вебхука Bitrix")

    // 1. Игнорируем req.body и query, сразу извлекаем данные из URL
    let dataStr = decodeURIComponent(req.originalUrl).replace(/^\/test/, "")

    // Если строка начинается с "|", убираем его
    if (dataStr.startsWith("|")) {
      dataStr = dataStr.slice(1)
    }
    dataStr = dataStr.trim()

    // 2. Если пусто — выдаём ошибку
    if (!dataStr) {
      logger.warn("Нет данных для обработки")
      return res.status(400).send("Пустое тело запроса")
    }

    // 3. Разбиваем строку на массив полей по символу "|"
    const fields = dataStr.split("|")

    logger.debug("Исходная строка:", dataStr)
    logger.debug("Разбитые поля:", JSON.stringify(fields, null, 2))

    // 4. Отправляем ответ клиенту с полученными данными
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
