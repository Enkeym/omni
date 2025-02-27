import { getUser } from "../services/omni.service.js"

export const getUsersByMultipleFields = async (data) => {
  let users = new Map()

  try {
    const searchFields = [
      { key: "user_phone", value: data.phone },
      { key: "user_email", value: data.contmail }
    ]

    for (const { key, value } of searchFields) {
      if (value) {
        const foundUsers = await getUser({ [key]: value })
        foundUsers.forEach((user) => {
          if (user?.user_id) {
            users.set(user.user_id, user)
          }
        })
      }
    }
  } catch (error) {
    console.error("Ошибка при поиске пользователей:", error)
    throw new Error(`Ошибка на сервере: ${error.message}`)
  }

  return Array.from(users.values())
}
