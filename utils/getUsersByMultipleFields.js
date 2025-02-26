// utils/getUsersByMultipleFields.js
import { getUser } from "../services/omni.service.js"

export const getUsersByMultipleFields = async (data) => {
  let users = new Map()

  try {
    const searchFields = [
      { key: "user_phone", value: data.phone },
      { key: "user_email", value: data.email },
      { key: "user_email", value: data.contmail }
    ]

    for (const { key, value } of searchFields) {
      if (value) {
        console.log(`Поиск пользователей по ${key}: ${value}`)
        const foundUsers = await getUser({ [key]: value })
        console.log(`Найдено пользователей: ${foundUsers.length}`)
        foundUsers.forEach((user) => {
          if (user?.user_id) {
            if (users.has(user.user_id)) {
              users.set(user.user_id, { ...users.get(user.user_id), ...user })
            } else {
              users.set(user.user_id, user)
            }
          }
        })
      }
    }
  } catch (error) {
    console.error("Ошибка при поиске пользователей:", error.message)
    throw new Error(`Ошибка на сервере: ${error.message}`)
  }

  console.log("Итоговый список пользователей:", Array.from(users.values()))
  return Array.from(users.values())
}
