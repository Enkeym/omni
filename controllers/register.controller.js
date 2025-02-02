// controllers/register.controller.js
import { bitrixUrl } from "../config.js"
import {
  createUser,
  editUser,
  getUser,
  postCase
} from "../services/omniService.js"
import { extractTarifText } from "../utils/extractTarifText.js"
import { createLogger } from "../utils/logger.js"
import { sendWa } from "../utils/sendWa.js"

//Общий штамп для логов
const logger = createLogger("REGISTER")

/**
 * Обрабатывает тестовый запрос на регистрацию и логирует входящие данные.
 * Данные могут передаваться через тело запроса или в URL (например, в параметре data).
 *
 * @param {object} req - Объект запроса Express.
 * @param {object} res - Объект ответа Express.
 */

export const register = async (req, res) => {
  try {
    logger.info("Начало обработки запроса регистрации")

    //Берем данные из URL
    const dataStr = req.body || req.query.data

    if (!dataStr) {
      logger.error("Тело запроса пустое")
      return res.status(400).send("Пустое тело запроса")
    }

    // Разбиваем строку на массив полей по разделителю "|"
    const fields = dataStr.split("|")
    logger.debug("Полученные поля:", fields)

    // Проверка количества элементов: ожидается 15, т.к. дублирующее поле "register" убрано
    if (fields.length !== 15) {
      logger.error("Ошибка: ожидалось 15 элементов, получено", fields.length)
      return res.status(400).send("Неверное количество элементов")
    }

    // Деструктуризация массива для получения всех полей
    const [
      tid, // Идентификатор заявки
      surname, // Фамилия
      name, // Имя
      email, // Email
      company, // Компания
      contname, // Имя контакта
      phone, // Телефон
      inn, // ИНН
      contmail, // Email контакта
      tg, // Telegram (без @)
      cat, // Категория
      role, // Роль
      tarif, // Строка тарифа
      comment, // Комментарий
      gs1 // Флаг регистрации GS1 ("Да" или иное значение)
    ] = fields
    logger.info("Поля запроса успешно разобраны")

    // Формирование ссылки на заявку в Bitrix24
    const dealUrl = `${bitrixUrl}/crm/deal/details/${tid}/`
    logger.debug("Ссылка на заявку:", dealUrl)

    // Обработка строки тарифа
    const tarifText = extractTarifText(tarif)
    logger.debug("Обработанный тариф:", tarifText)

    // Выбор эмодзи для темы заявки
    const emo = role === "Производитель" ? "📑" : "📄"
    const gs1Emoji = gs1 === "Да" ? "🌐" : ""

    // Отправка уведомления через WhatsApp
    logger.info("Отправка уведомления через WhatsApp для телефона:", phone)
    const waStatus = await sendWa(phone)
    logger.info("Статус WhatsApp уведомления:", waStatus)

    // Формирование объекта для создания заявки в OmniDesk
    const caseData = {
      case: {
        user_email: email,
        cc_emails: ["vshumovsky@getmark.ru"],
        status: "open",
        user_full_name: `${surname} ${name}`,
        subject: `${emo}${
          comment ? "❗" : ""
        }${gs1Emoji} Регистрация. ${company}`,
        content: `Организация: ${company}
Контакт: ${phone} ${contname}
Категория: ${cat} ${role}
Тариф: ${tarifText}
Инструкция ${waStatus}
Ссылка на заявку: ${dealUrl}
${gs1Emoji ? "🌐 Регистрация в ГС1!" : ""}
${comment ? "❗ Комментарий: " : ""}${comment}
`
      }
    }

    logger.info("Отправка данных заявки в OmniDesk")
    const { status } = await postCase(caseData)
    logger.info("Заявка создана. Статус ответа:", status)

    // Формирование данных для создания или обновления профиля пользователя
    let userData = {
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

      logger.info("Отправка данных для обновления профиля пользователя")
      const { data: editData } = await editUser(userId, userData)
      logger.info("Профиль обновлён:", editData)
    } else {
      // Пользователь не найден – создаём новый профиль
      logger.info("Пользователь не найден. Создание нового профиля")
      const { data: createData } = await createUser(userData)
      logger.info("Новый профиль создан:", createData)
    }
    res.sendStatus(200)
  } catch ({ message }) {
    logger.error("Ошибка при обработке регистрации:", message)
    res.status(500).send("Внутренняя ошибка сервера")
  }
}
