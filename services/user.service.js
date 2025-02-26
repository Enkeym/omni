import { getUsersByMultipleFields } from "../utils/getUsersByMultipleFields.js"

import { createUser, deleteAllLinkedUsers, editUser } from "./omni.service.js"

export async function processUser(data) {
  // Изначальный поиск пользователя по нескольким полям
  let existingUsers = []
  try {
    existingUsers = await getUsersByMultipleFields(data)
  } catch (error) {
    console.error("Ошибка при поиске пользователя:", error)
    throw new Error(`Ошибка на сервере: ${error.message}`)
  }

  // Фильтруем – оставляем только пользователей с user_id
  existingUsers = existingUsers.filter((usr) => usr && usr.user_id)

  // Пока найдено больше одного пользователя, обрабатываем дубликаты
  while (existingUsers.length > 1) {
    // Получаем список дубликатов (все, кроме первого)
    const duplicates = existingUsers.slice(1)
    for await (const dup of duplicates) {
      if (!dup?.user_id) continue
      try {
        console.log(`Удаляем дубликат: user_id=${dup.user_id}`)
        await deleteAllLinkedUsers(dup.user_id)
        console.log(`Очищаем номер телефона у дубликата ID=${dup.user_id}`)
        await editUser(dup.user_id, {
          user: { user_phone: "" }
        })
      } catch (err) {
        console.error("Ошибка удаления дубликата:", err.message)
      }
    }

    // После обработки дубликатов повторно запрашиваем пользователей
    try {
      existingUsers = await getUsersByMultipleFields(data)
    } catch (error) {
      console.error("Ошибка при повторном поиске пользователя:", error.message)
      throw new Error(`Ошибка на сервере: ${error.message}`)
    }
    existingUsers = existingUsers.filter((usr) => usr && usr.user_id)
  }

  // Если остался ровно один пользователь, считаем его основным
  const mainUser = existingUsers.length === 1 ? existingUsers[0] : null

  // Подготовка данных для создания/обновления пользователя
  const userData = {
    user: {
      user_full_name: data.contname,
      company_name: data.company,
      company_position: data.inn,
      user_phone: data.phone,
      user_telegram: data.tg.replace("@", ""),
      user_note: data.cleanNotes
    }
  }

  // Если найден пользователь — обновляем, иначе создаём нового
  let resultUser = null
  try {
    if (!mainUser) {
      console.log("Пользователь не найден, создаём нового...")
      resultUser = await createUser(userData)
      console.log("Новый пользователь создан:", resultUser.user_id)
    } else {
      console.log(`Обновляем пользователя ID=${mainUser.user_id}...`)
      resultUser = await editUser(mainUser.user_id, userData)
      console.log("Пользователь обновлён:", resultUser.user_id)
    }
  } catch (err) {
    // Здесь можно добавить дополнительную обработку ошибок (например, для phone_already_exists)
    console.error("Ошибка при создании/обновлении пользователя:", err.message)
    throw err
  }

  return resultUser
}
