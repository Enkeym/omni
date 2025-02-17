// services/register.service.js
import { parseRequest } from "../utils/parseRequest.js"
import { sendWa } from "../utils/sendWa.js"

import {
  createCase,
  createUser,
  deleteUser,
  editUser,
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

    // Создание нового пользователя
    if (existingUsers.length === 0) {
      console.log("Пользователя не найдено, создаём нового...")

      try {
        const newUser = await createUser(userData)
        console.log(
          `Новый пользователь создан: ID ${newUser.user_id}`,
          JSON.stringify(newUser, null, 2)
        )
      } catch (error) {
        console.log("Ошибка при создании пользователя:", error.message)
      }
    } else {
      console.log(`Найдено пользователей: ${existingUsers.length}`)

      const mainUser = existingUsers[0]
      const duplicates = existingUsers.slice(1)

      // Удаляем дубликаты
      if (duplicates.length > 0) {
        for await (const dupUSer of duplicates) {
          try {
            console.log(`Удаляем дубликат: user_id=${dupUSer.user_id}`)
            await unlinkAllLinkedUsers(dupUSer?.user_id)
            await deleteUser(dupUSer.user_id)
          } catch (error) {
            console.error("Ошибка удаления дубликата:", error.message)
          }
        }
      }

      try {
        const updatedUser = await editUser(mainUser.user_id, userData)
        console.log(
          `пользователь обновлен: ID(${updatedUser.user_id}):`,
          JSON.stringify(updatedUser, null, 2)
        )
      } catch (error) {
        console.error("Ошибка при обновлении пользователя:", error.message)
      }
    }

    res.sendStatus(200)
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

    console.error(`Ошибка: ${error.message}`)
    return res
      .status(500)
      .json({ error: "Ошибка на сервере", details: error.message })
  }
}
