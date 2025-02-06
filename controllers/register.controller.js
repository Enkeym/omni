// controllers/register.controller.js
import { bitrixUrl } from "../config.js"
import { createUser, getUser, postCase } from "../services/omniService.js"
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
    logger.info("Начало обработки запроса регистрации")
    let dataStr = decodeURIComponent(req.originalUrl).replace(/^\/register/, "")

    // Если строка начинается с "|", убираем его
    if (dataStr.startsWith("|")) {
      dataStr = dataStr.slice(1)
    }
    dataStr = dataStr.trim()

    // Проверка на пустое тело запроса
    if (!dataStr) {
      return res.status(400).send("Пустое тело запроса")
    }

    // Разбиваем строку на массив полей по символу "|"
    const fields = dataStr.split("|")
    if (fields.length !== 15) {
      return res
        .status(400)
        .send(`Неверное количество элементов: ${fields.length}`)
    }

    // 5. Деструктуризация (15 полей)
    const [
      tid, // {{ID элемента CRM}}
      surname, // {{Контакт: Фамилия}}
      firstName, // {{Контакт: Имя}}
      email, // {{Ответственный (e-mail)}}
      company, // {{Компания: Название компании}}
      contname, // {{Контакт: Имя}} - дублирующее поле или "другое контактное лицо"
      phone, // {{Контакт: Рабочий телефон}}
      inn, // {{ИНН}}
      contmail, // {{Эл.почта}}
      tg, // {{Телеграм}}
      cat, // {{Категория}}
      role, // {{Роль (вид торговли) (текст)}}
      tarif, // [td]{{Товарные позиции (текст)}}[/td]
      comment, // {{Комментарий для тех. отдела}}
      gs1 // {{ГС1 > printable}}
    ] = fields
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

      if (userResponse && Object.keys(userResponse).length > 0) {
        existingUser = userResponse[0]?.user || null
        logger.warn("Пользователь найден, ID:", existingUser?.user_id)
      }
    } catch (error) {
      logger.error("Ошибка при получении данных пользователя:", error.message)
    }

    // Если пользователь есть
    if (existingUser) {
      logger.warn("Пользователь уже существует, создание нового не требуется.")
      return res.sendStatus(200)
    }

    // Пользователь не найдет
    logger.info("Пользователь не найден, создаём нового.")

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
      "Отправляемые данные в OmniDesk:",
      JSON.stringify(caseData, null, 2)
    )
    const { status } = await postCase(caseData)
    logger.info("Заявка создана. Статус ответа:", status)

    // Используем email из запроса вместо уникального email
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
