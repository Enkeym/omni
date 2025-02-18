import {
  createUser,
  editUser,
  getUser,
  unlinkAllLinkedUsers
} from "./omni.service.js"

export async function processUser(data) {
  // Поиск пользователя
  let existingUsers = []
  try {
    existingUsers = await getUser({
      user_phone: data.phone,
      user_email: data.contmail
    })
  } catch (error) {
    console.error("Ошибка при поиске пользователя:", error)
    throw new Error(`Ошибка на сервере: ${error.message}`)
  }

  existingUsers = existingUsers.filter((usr) => usr && usr.user_id)
  let mainUser = existingUsers.length > 0 ? existingUsers[0] : null

  // Удаление дубликатов
  if (existingUsers.length > 1) {
    const duplicates = existingUsers.slice(1)
    for await (const dup of duplicates) {
      if (!dup?.user_id) continue
      try {
        console.log(`Удаляем дубликат: user_id=${dup.user_id}`)
        await unlinkAllLinkedUsers(dup.user_id)
      } catch (err) {
        console.error("Ошибка удаления дубликата:", err.message)
      }
    }
  }

  // Данные для создания/обновления пользователя
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

  // Создание или обновление
  try {
    if (!mainUser) {
      console.log("Пользователь не найден, создаём нового...")
      mainUser = await createUser(userData)
      console.log("Новый пользователь создан:", mainUser.user_id)
    } else {
      console.log(`Обновляем пользователя ID=${mainUser.user_id}...`)
      mainUser = await editUser(mainUser.user_id, userData)
      console.log("Пользователь обновлён:", mainUser.user_id)
    }
  } catch (err) {
    if (err.message.includes("email_already_exists")) {
      console.error("Ошибка: email уже привязан к другому пользователю.")
      let existingEmailUser = []
      try {
        existingEmailUser = await getUser({ user_email: data.contmail })
      } catch (findError) {
        console.error("Ошибка поиска пользователя по email:", findError.message)
      }
      if (existingEmailUser.length) {
        console.log(
          "Найден пользователь по email:",
          existingEmailUser[0].user_id
        )
        mainUser = existingEmailUser[0]
      } else {
        console.warn("Пользователь с таким email не найден.")
      }
    } else {
      console.error("Ошибка создания/обновления пользователя:", err.message)
    }
  }
  return mainUser
}
