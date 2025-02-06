import { createLogger } from "../utils/logger.js"

const logger = createLogger("PAYMENT")

/**
 * Обрабатывает информацию об успешной оплате.
 */
export const payment = async (req, res) => {
  try {
    logger.info("🔹 Получена информация об оплате")

    let dataStr = decodeURIComponent(req.originalUrl)
      .replace(/^\/payment/, "")
      .trim()

    if (dataStr.startsWith("|")) {
      dataStr = dataStr.slice(1)
    }
    if (!dataStr) {
      logger.error("❌ Ошибка: Пустое тело запроса")
      return res.status(400).send("Пустое тело запроса")
    }

    const fields = dataStr.split("|")

    if (fields.length < 2) {
      logger.error(`❌ Ошибка: Неверное количество элементов: ${fields.length}`)
      return res.status(400).send("Неверное количество элементов")
    }

    const [transactionId, userId, amount] = fields

    logger.info(
      `✅ Оплата зарегистрирована: Транзакция ${transactionId}, Пользователь ${userId}, Сумма ${amount}`
    )

    res.status(200).send(`✅ Оплата успешно обработана: ${transactionId}`)
  } catch (error) {
    logger.error("Ошибка при обработке платежа:", error.message)
    res.status(500).send("Внутренняя ошибка сервера")
  }
}
