import {
  createCase,
  createUser,
  editUser,
  getUser,
  unlinkAllLinkedUsers
} from "../services/omni.service.js"
import { parseRequest } from "../utils/parseRequest.js"

export const payment = async (req, res) => {
  try {
    const data = parseRequest(req.path)

    console.log(data)

    //Поиск пользователей
    let existingUsers = []
    existingUsers = existingUsers.filter((usr) => usr && usr.user_id)

    try {
      existingUsers = await getUser({
        user_phone: data.phone,
        user_email: data.contmail
      })
    } catch (error) {
      console.error("Ошибка при поиске пользователя:", error)
      throw new Error(`Ошибка на сервере: ${error.message}`)
    }

    let mainUser = null
    if (existingUsers.length > 0) {
      mainUser = existingUsers[0]
      const duplicates = existingUsers.slice(1)

      // Удаляем дубликаты
      if (duplicates.length > 0) {
        for await (const dup of duplicates) {
          if (!dup?.user_id) {
            console.warn("Пропускаем дубликат без user_id:", dup)
            continue
          }
          try {
            console.log(`Удаляем дубликат: user_id=${dup.user_id}`)
            await unlinkAllLinkedUsers(dup.user_id)
          } catch (err) {
            console.error("Ошибка удаления дубликата:", err.message)
          }
        }
      }
    }

    // Данные для создания или обновления пользователя
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

    // Создание или обновление пользователя
    try {
      if (!mainUser) {
        console.log("Пользователь не найден, создаём нового...")
        mainUser = await createUser(userData)
        console.log("Новый пользователь создан:", mainUser.user_id)
      } else {
        console.log(
          `Обновляем «главного» пользователя ID=${mainUser.user_id}...`
        )
        mainUser = await editUser(mainUser.user_id, userData)
        console.log("Пользователь обновлён:", mainUser.user_id)
      }
    } catch (err) {
      if (err.message.includes("email_already_exists")) {
        console.error(
          "Ошибка: этот email уже привязан к другому пользователю. Ищем существующего..."
        )

        let existingEmailUser = []
        try {
          existingEmailUser = await getUser({ user_email: data.contmail })
        } catch (findError) {
          console.error(
            "Не удалось найти пользователя по email:",
            findError.message
          )
        }

        if (existingEmailUser.length) {
          console.log(
            "Найден существующий пользователь:",
            existingEmailUser[0].user_id
          )
          mainUser = existingEmailUser[0]
        } else {
          console.warn(
            "Пользователь с таким email не найден. Возможно, ошибка в API."
          )
        }
      } else {
        console.error(
          "Ошибка при создании/обновлении пользователя:",
          err.message
        )
      }
    }

    // Создаём "кейс" (заявку) в OmniDesk
    const caseData = {
      case: {
        user_email: data.email,
        status: "open",
        content_type: "html",
        user_full_name: `${data.surname} ${data.firstName}`,
        subject: `Продление. ${data.company} - ${Date.now()}`,
        content: `Оплата получена!\n
    Дата продления: ${data.paymentDate}
    Организация: ${data.company}
    Контакт: ${data.phone} ${data.contname}
    Категория: ${data.cat} ${data.role}
    Доп. информация: ${data.cleanTarif}
    Ссылка на заявку: ${data.dealUrl}
    ${data.comment ? "Комментарий: " + data.comment : ""}`
      }
    }

    console.log(
      "Создаём кейс (заявку) в OmniDesk...",
      JSON.stringify(caseData, null, 2)
    )
    try {
      const newCase = await createCase(caseData)
      console.log("Кейс успешно создан:", newCase)
    } catch (err) {
      console.error("Ошибка при создании кейса:", err.message)
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
    console.error("Ошибка:", error.message)
    return res.status(500).json({
      error: "Ошибка на сервере",
      details: error.message
    })
  }
}
