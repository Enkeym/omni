import { getUsersByMultipleFields } from "../utils/getUsersByMultipleFields.js"

import { createUser, deleteAllLinkedUsers, deleteUser } from "./omni.service.js"

export async function processUser(data) {
  // Поиск пользователя по нескольким полям
  let existingUsers = []
  try {
    existingUsers = await getUsersByMultipleFields(data)
  } catch (error) {
    console.error("Ошибка при поиске пользователя:", error)
    throw new Error(`Ошибка на сервере: ${error.message}`)
  }

  // Фильтруем – оставляем только пользователей с user_id
  existingUsers = existingUsers.filter((usr) => usr && usr.user_id)

  // Если найдены пользователи, удаляем каждого полностью
  if (existingUsers.length > 0) {
    for await (const usr of existingUsers) {
      try {
        console.log(
          `Обрабатываем удаление пользователя: user_id=${usr.user_id}`
        )
        await deleteAllLinkedUsers(usr?.user_id)
        await deleteUser(usr?.user_id)
      } catch (err) {
        console.error("Ошибка при удалении пользователя:", err.message)
      }
    }
  } else {
    console.log("Пользователей по заданным параметрам не найдено.")
  }

  // Подготовка данных для создания нового пользователя
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

  // Создаём нового пользователя
  let resultUser = null
  try {
    console.log("Создаём нового пользователя...")
    resultUser = await createUser(userData)
    console.log("Новый пользователь создан:", resultUser.user_id)
  } catch (err) {
    console.error("Ошибка при создании пользователя:", err.message)
    throw err
  }

  return resultUser
}
