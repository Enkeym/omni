import { parseRequest } from "../utils/parseRequest.js"
import { sendWa } from "../utils/sendWa.js"

import { processCase } from "./case.service.js"

export async function processFlow(req, res, options = {}) {
  const {
    subjectPrefix = "Регистрация",
    contentPrefix = "",
    sendWhatsApp = false,
    isTestMode = false
  } = options

  try {
    // Парсинг запроса
    const data = parseRequest(req.path)
    console.log("Обработанные данные:", data)

    // Обработка пользователя: поиск, удаление дубликатов, создание/обновление
    /*   const mainUser = await processUser(data)
    console.log("Полученный пользователь:", mainUser) */

    let waStatus = "Не отправляется"
    if (sendWhatsApp && !isTestMode) {
      console.info("Отправка WhatsApp...")
      try {
        waStatus = await sendWa(data.phone)
      } catch (error) {
        console.error("Ошибка при отправке WhatsApp:", error.message)
      }
    }

    // Создание кейса (заявки)
    await processCase(data, subjectPrefix, contentPrefix, waStatus)

    return res.sendStatus(200)
  } catch (error) {
    if (
      error.message.startsWith("Некорректный телефон") ||
      error.message.startsWith("Некорректный e-mail") ||
      error.message.startsWith("Неверное число элементов") ||
      error.message.includes("Пустое тело запроса")
    ) {
      console.error("Ошибка валидации:", error.message)
      return res.status(400).json({ error: error.message })
    }
    console.error("Ошибка:", error.message)
    return res.status(500).json({
      error: "Ошибка на сервере",
      details: error.message
    })
  }
}
