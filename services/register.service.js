import { parseRequest } from "../utils/parseRequest.js"
import { sendWa } from "../utils/sendWa.js"

import {
  createCase,
  createUser,
  deleteUser,
  getUser,
  unlinkAllLinkedUsers
} from "./omni.service.js"

export const processRegistration = async (req, res, isTestMode) => {
  try {
    const data = parseRequest(req.path)

    //Поиск пользователей
    let existingUsers = []

    try {
      existingUsers = await getUser({
        user_phone: data.phone,
        user_email: data.contmail
      })
    } catch (error) {
      console.error(`ошибка: ${error}`)
      throw new Error(`Ошибка на сервере: ${error.message}`)
    }

    //Удаление пользователей
    if (existingUsers.length > 0) {
      for await (const user of existingUsers) {
        try {
          await unlinkAllLinkedUsers(user?.user_id)
          await deleteUser(user?.user_id)
        } catch (error) {
          console.error(`Ошибка удаления: ${error.message}`)
        }
      }
    }

    //Отправка в WatsApp
    let waStatus = "Не отправляется"

    if (!isTestMode) {
      console.info("Начинаем отправку в WatsApp...")
      try {
        waStatus = await sendWa(data.phone)
      } catch (error) {
        console.error("Ошибка при отправке WhatsApp:", error.message)
      }
    } else {
      console.info("Тестовый режим, WhatsApp НЕ отправляется!")
    }

    //Создание заявки
    const caseData = {
      case: {
        user_email: data.email,
        status: "open",
        content_type: "html",
        user_full_name: `${data.surname} ${data.firstName}`,
        subject: `Регистрация. ${data.company} - ${Date.now()}`,
        content: `Организация: ${data.company}
Контакт: ${data.phone} ${data.contname}
Категория: ${data.cat} ${data.role}
Тариф: ${data.cleanTarif}
Инструкция: ${waStatus}
Ссылка на заявку: ${data.dealUrl}
${data.gs1 === "Да" ? "🌐 Регистрация в ГС1!" : ""}
${data.comment ? "❗ Комментарий: " + data.comment : ""}`
      }
    }

    //Логирование заявки
    console.log("Создана заявка:", JSON.stringify(caseData, null, 2))

    //Отправка заявки в OmniDesk
    try {
      const newCase = await createCase(caseData)
      console.log("Заявка успешно создана:", newCase)
    } catch (error) {
      console.log("Ошибка при создании заявки:", error.message)
    }

    //Создание нового пользователя
    const userData = {
      user: {
        user_full_name: data.contname,
        company_name: data.company,
        company_position: data.inn,
        user_phone: data.phone,
        user_email: data.contmail,
        user_telegram: data.tg.replace("@", ""),
        user_note: data.cleanNotes
      }
    }

    //Логирование пользователя
    console.log("Создан пользователь:", JSON.stringify(userData, null, 2))

    try {
      const newUser = await createUser(userData)
      console.log(`Новый пользователь создан: ID ${newUser.user_id}`)
    } catch (error) {
      console.log("Ошибка при создании пользователя:", error.message)
    }

    res.sendStatus(200)
  } catch (error) {
    console.error(`Ошибка: ${error.message}`)
    res.status(500).json({ error: "Ошибка на сервере", details: error.message })
  }
}
