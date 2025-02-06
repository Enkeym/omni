import { bitrixUrl } from "../config.js"
import {
  createUser,
  deleteOldCases,
  getUser,
  postCase
} from "../services/omniService.js"
import { cleanOmniNotes } from "../utils/cleanOmniNotes.js"
import { extractTarifText } from "../utils/extractTarifText.js"
import { createLogger } from "../utils/logger.js"
import { sendWa } from "../utils/sendWa.js"

const logger = createLogger("REGISTER")

/**
 * Обрабатывает запрос на регистрацию и логирует входящие данные.
 * Данные могут передаваться через тело запроса, в query-параметре data
 * или непосредственно в URL (например, /register|ID|...).
 */
export const register = async (req, res) => {
  try {
    logger.info("🔹 Начало обработки запроса регистрации")

    // Выводим URL запроса перед обработкой
    logger.debug("🔹 Исходный URL запроса:", req.originalUrl)

    // Декодируем URL и удаляем /register
    let dataStr = decodeURIComponent(req.originalUrl)
      .replace(/^\/register/, "")
      .trim()

    // Логируем после декодирования
    logger.debug("🔹 Декодированная строка данных:", dataStr)

    // Проверяем, начинается ли строка с "|", удаляем
    if (dataStr.startsWith("|")) {
      dataStr = dataStr.slice(1)
      logger.debug("🔹 Убрали начальный '|', новая строка данных:", dataStr)
    }

    // Проверяем, пустая ли строка
    if (!dataStr) {
      logger.error("❌ Ошибка: Пустое тело запроса")
      return res.status(400).send("Пустое тело запроса")
    }

    // Разбиваем строку по "|"
    const fields = dataStr.split("|")

    // Логируем полученный массив
    logger.debug("🔹 Разбитые данные (fields):", fields)

    // Проверяем корректное количество полей
    if (fields.length !== 15) {
      logger.error(
        `❌ Ошибка: Неверное количество элементов: ${fields.length} вместо 15`
      )
      return res
        .status(400)
        .send(`Неверное количество элементов: ${fields.length}`)
    }

    // Деструктуризация полей
    const [
      tid,
      surname,
      firstName,
      email,
      company,
      contname,
      phone,
      inn,
      contmail,
      tg,
      cat,
      role,
      tarif,
      comment,
      gs1
    ] = fields

    logger.info("✅ Поля запроса успешно разобраны")
    logger.debug("🔹 tid:", tid)
    logger.debug("🔹 surname:", surname)
    logger.debug("🔹 firstName:", firstName)
    logger.debug("🔹 email:", email)
    logger.debug("🔹 company:", company)
    logger.debug("🔹 phone:", phone)

    logger.info("Поля запроса успешно разобраны")

    const dealUrl = `${bitrixUrl}/crm/deal/details/${tid}/`
    let tarifText = cleanOmniNotes(extractTarifText(tarif))

    // Получение данных о пользователи
    logger.info("Получение данных пользователя по телефону:", phone)
    let existingUser = null

    try {
      const { data: userResponse } = await getUser({
        user_phone: phone,
        user_email: contmail
      })
      logger.debug("Ответ OmniDesk при получении пользователя:", userResponse)

      // Фильтруем пользователей по email и номеру
      const matchedUser = Object.values(userResponse).find((userObj) => {
        const user = userObj.user
        return (
          user.user_phone === phone ||
          user.wa_id === phone ||
          user.user_email === contmail
        )
      })

      if (matchedUser) {
        existingUser = matchedUser.user
        logger.warn("Пользователь найден, ID:", existingUser?.user_id)
      }
    } catch (error) {
      logger.error("Ошибка при получении данных пользователя:", error.message)
    }

    // Если пользователь найден, удаляем старые заявки, кроме последней
    if (existingUser) {
      logger.warn(
        "Пользователь уже существует. Удаляем старые заявки, кроме последней..."
      )
      try {
        const deletedCount = await deleteOldCases(existingUser.user_id)
        logger.info(`Удалено старых заявок: ${deletedCount}`)
      } catch (error) {
        logger.error("Ошибка при удалении старых заявок:", error.message)
      }
    }

    // Отправляем уведомление через WhatsApp
    logger.info("Отправка уведомления через WhatsApp для телефона:", phone)
    const waStatus = phone ? await sendWa(phone) : "не отправлена ❌"
    logger.info("Статус WhatsApp уведомления:", waStatus)

    // Создаём заявку
    const caseData = {
      case: {
        user_email: email,
        cc_emails: ["atsatryan@getmark.ru"],
        status: "open",
        content_type: "html",
        user_full_name: `${surname} ${firstName}`,
        subject: `Регистрация. ${company} - ${Date.now()}`,
        content: `Организация: ${company}
Контакт: ${phone} ${contname}
Категория: ${cat} ${role}
Тариф: ${tarifText}
Инструкция: ${waStatus}
Ссылка на заявку: ${dealUrl}
${gs1 === "Да" ? "🌐 Регистрация в ГС1!" : ""}
${comment ? "❗ Комментарий: " + comment : ""}`
      }
    }

    logger.debug(
      "Отправляем заявку в OmniDesk:",
      JSON.stringify(caseData, null, 2)
    )
    try {
      const { status, data } = await postCase(caseData)
      logger.info(`Заявка отправлена в OmniDesk. Статус: ${status}`)
      logger.debug("Ответ OmniDesk:", JSON.stringify(data, null, 2))
    } catch (error) {
      logger.error("Ошибка при отправке заявки в OmniDesk:", error.message)
      if (error.response) {
        logger.error(
          "Детали ошибки:",
          JSON.stringify(error.response.data, null, 2)
        )
        logger.error("HTTP статус:", error.response.status)
      }
    }

    // Если пользователь уже существовал, новую заявку создали, но пользователя обновлять не нужно
    if (existingUser) {
      return res.sendStatus(200)
    }

    // Создание нового пользователя
    logger.info("Создаем новый профиль пользователя...")
    const userData = {
      user: {
        user_full_name: contname,
        company_name: company,
        company_position: inn,
        user_phone: phone,
        user_email: contmail,
        user_telegram: tg.replace("@", ""),
        user_note: tarifText
      }
    }

    try {
      const { data: createData } = await createUser(userData)
      logger.info("Новый профиль успешно создан:", createData)
      res.sendStatus(200)
    } catch (error) {
      logger.error("Ошибка при создании пользователя:", error.message)
      if (error.response) {
        logger.error(
          "Детали ошибки:",
          JSON.stringify(error.response.data, null, 2)
        )
        logger.error("HTTP Статус ответа:", error.response.status)
        logger.error(
          "Заголовки ответа:",
          JSON.stringify(error.response.headers, null, 2)
        )
      }
      res.status(500).send("Ошибка при создании нового пользователя")
    }
  } catch (error) {
    logger.error("Ошибка при обработке регистрации:", error.message)
    res.status(500).send("Внутренняя ошибка сервера")
  }
}
