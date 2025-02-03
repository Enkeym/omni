// controllers/register.controller.js
import { bitrixUrl } from "../config.js"
import {
  createUser,
  editUser,
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
    logger.info("Начало обработки запроса регистрации")
    // 1. Сразу ИГНОРИРУЕМ req.body, потому что там лежат document_id=...
    // let dataStr = req.body || req.query.data;
    let dataStr = ""

    // 2. Всегда берём URL:
    //    req.originalUrl может быть "/register|D_52230|Название|..."
    dataStr = decodeURIComponent(req.originalUrl).replace(/^\/register/, "")
    if (dataStr.startsWith("|")) {
      dataStr = dataStr.slice(1)
    }
    dataStr = dataStr.trim()

    // 3. Если получилось пусто — ошибку
    if (!dataStr) {
      return res.status(400).send("Пустое тело запроса")
    }

    // 4. Разбиваем по "|"
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

    // Пример лога
    logger.debug(
      "tid:",
      tid,
      "surname:",
      surname,
      "firstName:",
      firstName,
      "..."
    )

    // Формирование ссылки на заявку в Bitrix24
    const dealUrl = `${bitrixUrl}/crm/deal/details/${tid}/`
    logger.debug("Ссылка на заявку:", dealUrl)

    // Пример обработки тарифа (если требуется)
    const tarifText = extractTarifText(tarif)
    tarifText = cleanOmniNotes(tarifText)
    logger.debug("Обработанный тариф:", tarifText)

    // Проверяем, что телефон не пустой, иначе WhatsApp упадёт
    logger.info("Отправка уведомления через WhatsApp для телефона:", phone)
    const waStatus = phone ? await sendWa(phone) : "не отправлена ❌"
    logger.info("Статус WhatsApp уведомления:", waStatus)

    // Формируем данные для OmniDesk (пример)
    const caseData = {
      case: {
        anonymous_email: `user+${Data.now()}@getmark.ru`,
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
${comment ? "❗ Комментарий: " + comment : ""}
`
      }
    }

    // Создаём заявку в OmniDesk
    logger.info("Отправка данных заявки в OmniDesk")
    const { status } = await postCase(caseData)
    logger.info("Заявка создана. Статус ответа:", status)

    // Создание / обновление профиля пользователя (пример)
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

    logger.info("Получение данных пользователя по телефону:", phone)
    const { data: userResponse } = await getUser({ user_phone: phone })
    logger.debug("Ответ OmniDesk при получении пользователя:", userResponse)

    if (userResponse && Object.keys(userResponse).length > 0) {
      // Пользователь найден – обновляем профиль
      const { user = {} } = userResponse["0"] || {}
      const userId = user.user_id
      logger.info("Пользователь найден. ID:", userId)

      // Удаляем поля, которые не следует обновлять
      delete userData.user.user_email
      delete userData.user.user_phone
      delete userData.user.user_telegram

      logger.info("Обновляем профиль пользователя")
      const { data: editData } = await editUser(userId, userData)
      logger.info("Профиль обновлён:", editData)
    } else {
      // Пользователь не найден – создаём новый профиль
      logger.info("Пользователь не найден. Создание нового профиля")
      const { data: createData } = await createUser(userData)
      logger.info("Новый профиль создан:", createData)
    }

    // Если всё успешно
    res.sendStatus(200)
  } catch (error) {
    logger.error("Ошибка при обработке регистрации:", error.message)
    res.status(500).send("Внутренняя ошибка сервера")
  }
}
