import { bitrixUrl } from "../config.js"
import { cleanOmniNotes } from "../utils/cleanOmniNotes.js"
import { extractTarifText } from "../utils/extractTarifText.js"
import { createLogger } from "../utils/logger.js"
import { sendWa } from "../utils/sendWa.js"

import { createUser, deleteUsers, getUser, postCase } from "./omni.service.js"

const logger = createLogger("REGISTER_SERVICE")

export const processRegistration = async (req, res, isTestMode) => {
  try {
    logger.info("🔹 Начало обработки запроса регистрации")

    // Выводим URL запроса перед обработкой
    logger.debug("🔹 Исходный URL запроса:", req.originalUrl)

    // Декодируем URL
    let dataStr = decodeURIComponent(req.originalUrl)

    // Убираем префикс /register или /register-test
    dataStr = dataStr.replace(/^\/(register-test|register)\|?/, "").trim()

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

    const dealUrl = `${bitrixUrl}/crm/deal/details/${tid}/`
    let tarifText = cleanOmniNotes(extractTarifText(tarif))

    // 🔍 **Поиск существующих пользователей**
    logger.info("🔍 Получение данных пользователя по телефону и email...")
    let existingUsers = []

    try {
      existingUsers = await getUser({ user_phone: phone, user_email: contmail })

      // Фильтруем корректных пользователей
      existingUsers = existingUsers.filter((user) => user && user.user_id)

      logger.debug("📌 Все пользователи, найденные в OmniDesk:", existingUsers)
    } catch (error) {
      logger.error(
        "❌ Ошибка при получении данных пользователя:",
        error.message
      )
    }

    // ✅ **Удаление старых пользователей, если найдено больше одного**
    if (existingUsers.length > 1) {
      logger.warn(
        `⚠️ Найдено ${existingUsers.length} пользователей. Удаляем всех.`
      )
      try {
        const deletedCount = await deleteUsers(existingUsers)
        logger.info(`✅ Удалено пользователей: ${deletedCount}`)
      } catch (error) {
        logger.error("❌ Ошибка при удалении пользователей:", error.message)
      }
    }

    // Если пользователь уже существует и остался только один, просто возвращаем его
    if (existingUsers.length === 1) {
      logger.warn(
        `✅ Пользователь уже существует (ID: ${existingUsers[0].user_id}), создание не требуется.`
      )
      return res.sendStatus(200)
    }

    // 📲 **Логика отправки WhatsApp**
    let waStatus = "не отправлена ❌"

    if (!isTestMode) {
      logger.info("🚀 Запускаем отправку WhatsApp...")
      try {
        waStatus = await sendWa(phone)
        logger.info("📌 Статус WhatsApp уведомления:", waStatus)
      } catch (error) {
        logger.error("❌ Ошибка при отправке WhatsApp:", error.message)
      }
    } else {
      logger.info("🛑 Тестовый режим, WhatsApp НЕ отправляется")
    }

    logger.info("📌 Статус WhatsApp уведомления:", waStatus)

    // 📝 **Создаём новую заявку**
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
      "📩 Отправляем заявку в OmniDesk:",
      JSON.stringify(caseData, null, 2)
    )

    try {
      const { status, data } = await postCase(caseData)
      logger.info(`✅ Заявка успешно отправлена в OmniDesk. Статус: ${status}`)
      logger.debug("📌 Ответ OmniDesk:", JSON.stringify(data, null, 2))
    } catch (error) {
      logger.error("❌ Ошибка при отправке заявки в OmniDesk:", error.message)
      if (error.response) {
        logger.error(
          "📌 Детали ошибки:",
          JSON.stringify(error.response.data, null, 2)
        )
        logger.error("📌 HTTP статус:", error.response.status)
      }
    }

    // 🆕 **Создание нового пользователя**
    logger.info("🆕 Создаем новый профиль пользователя...")
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
      const createdUser = await createUser(userData)

      if (!createdUser || !createdUser.user_id) {
        throw new Error(
          "OmniDesk не вернул корректного ответа о создании пользователя"
        )
      }

      logger.info(`✅ Новый профиль успешно создан: ID ${createdUser.user_id}`)
      res.sendStatus(200)
    } catch (error) {
      logger.error("❌ Ошибка при создании пользователя:", error.message)
      if (error.response) {
        logger.error(
          "📌 Детали ошибки:",
          JSON.stringify(error.response.data, null, 2)
        )
        logger.error("📌 HTTP статус:", error.response.status)
        logger.error(
          "📌 Заголовки ответа:",
          JSON.stringify(error.response.headers, null, 2)
        )
      }
      res.status(500).send("❌ Ошибка при создании нового пользователя")
    }
  } catch (error) {
    logger.error("❌ Ошибка при обработке регистрации:", error.message)
    res.status(500).send("❌ Внутренняя ошибка сервера")
  }
}
