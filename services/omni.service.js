import axios from "axios"

import { omnideskApiKey, omnideskEmail, omnideskUrl } from "../config.js"
import { unlinkWithRetry } from "../utils/unlinkWithRetry.js"

const headers = { "Content-Type": "application/json" }
const auth = {
  username: omnideskEmail,
  password: omnideskApiKey
}

export const getUser = async (params) => {
  const url = `${omnideskUrl}/api/users.json`
  const response = await axios.get(url, { headers, auth, params })
  return Object.values(response.data).map((objUser) => objUser.user)
}

export const deleteUser = async (userId) => {
  if (!userId) {
    throw new Error("Нет userId для удаления")
  }

  try {
    const url = `${omnideskUrl}/api/users/${userId}.json`
    console.log(`Отправка DELETE запроса на ${url}`)

    const response = await axios.delete(url, { headers, auth })

    console.log("Ответ от сервера:", JSON.stringify(response.data, null, 2))
    return response.data.user || {}
  } catch (error) {
    console.error(
      ` Ошибка при удалении пользователя ${userId}: ${error.message}`
    )

    if (error.response) {
      console.error(
        "Детали ошибки:",
        JSON.stringify(error.response.data, null, 2)
      )
    }

    throw new Error(
      `Ошибка при удалении: ${error.response?.data?.error || error.message}`
    )
  }
}

export const unlinkAllLinkedUsers = async (userId) => {
  if (!userId) {
    throw new Error("Не передан userId для отвязки связанных пользователей")
  }

  try {
    const getUrl = `${omnideskUrl}/api/users/${userId}.json`
    const getResponse = await axios.get(getUrl, { headers, auth })
    const user = getResponse.data.user

    if (!user) {
      console.warn(`Пользователь с ID ${userId} не найден`)
      return
    }

    if (!Array.isArray(user.linked_users) || user.linked_users.length === 0) {
      console.log(`У пользователя ${userId} нет связанных профилей.`)
      return
    }

    console.log(
      `Найдено ${user.linked_users.length} связанных пользователей. Начинаем отвязку...`
    )

    await Promise.all(
      user.linked_users.map(async (linkedUserId) => {
        const unlinkUrl = `${omnideskUrl}/api/users/${userId}/unlink.json`
        const body = { user_id: linkedUserId }
        console.log(`Отправка PUT-запроса для отвязки user_id=${linkedUserId}`)

        const unlinkResponse = await unlinkWithRetry(unlinkUrl, body, {
          headers,
          auth
        })

        console.log(
          `Пользователь ${linkedUserId} успешно отвязан от ${userId}. `,
          unlinkResponse.data
        )
      })
    )

    console.log(
      `Все связанные пользователи (${user.linked_users.length} шт.) отвязаны от ${userId}.`
    )
  } catch (error) {
    console.error(
      `Ошибка при отвязке пользователей от ${userId}:`,
      error.response?.data || error.message
    )
    throw error
  }
}

export const createCase = async (caseData) => {
  if (!caseData) {
    throw new Error("Некорректные данные:", caseData)
  }

  try {
    const url = `${omnideskUrl}/api/cases.json`
    const response = await axios.post(url, caseData, { headers, auth })
    return response.data
  } catch (error) {
    console.log("Ошибка при создании заявки:", error.message)
    throw new Error(
      `Ошибка при создании заявки: ${
        error.response?.data?.error || error.message
      }`
    )
  }
}

export const createUser = async (userData) => {
  if (!userData) {
    throw new Error("Некорректные данные:", userData)
  }

  try {
    const url = `${omnideskUrl}/api/users.json`
    const response = await axios.post(url, userData, { headers, auth })
    return response.data.user
  } catch (error) {
    console.log("Ошибка при создании пользователя:", error.message)
    throw new Error(
      `Ошибка при создании пользователя: ${
        error.response?.data?.error || error.message
      }`
    )
  }
}
