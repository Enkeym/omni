// services/omni.service.js
import axios from "axios"

import { omnideskApiKey, omnideskEmail, omnideskUrl } from "../config.js"
import { unlinkWithRetry } from "../utils/unlinkWithRetry.js"

// Общие заголовки и auth для всех запросов
const headers = { "Content-Type": "application/json" }
const auth = {
  username: omnideskEmail,
  password: omnideskApiKey
}

// ------------------------- CASES -------------------------

// Создать заявку (case)
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

// Получить список заявок (cases), с возможностью пробросить query-параметры (например, page)
export const getCases = async (params = {}) => {
  try {
    const url = `${omnideskUrl}/api/cases.json`
    const response = await axios.get(url, {
      headers,
      auth,
      params
    })
    return response.data
  } catch (error) {
    console.error("Ошибка при получении списка заявок:", error.message)
    throw error
  }
}

// Получить заявку (case) по ID
export const getCaseById = async (caseId) => {
  try {
    const url = `${omnideskUrl}/api/cases/${caseId}.json`
    const response = await axios.get(url, { headers, auth })
    return response.data
  } catch (error) {
    console.error("Ошибка при получении заявки по ID:", error.message)
    throw error
  }
}

// Удалить заявку (case) по ID
export const deleteCase = async (caseId) => {
  try {
    const url = `${omnideskUrl}/api/cases/${caseId}.json`
    const response = await axios.delete(url, { headers, auth })
    return response.data
  } catch (error) {
    console.error("Ошибка при удалении заявки:", error.message)
    throw error
  }
}

// Изменить заявку (case) по ID
export const editCase = async (caseId, caseData) => {
  try {
    const url = `${omnideskUrl}/api/cases/${caseId}.json`
    const response = await axios.put(url, caseData, { headers, auth })
    return response.data
  } catch (error) {
    console.error("Ошибка при редактировании заявки:", error.message)
    throw error
  }
}

// ------------------------- USERS -------------------------

// Получить список пользователей, фильтруя по телефону и/или email
// Omnidesk ищет по query-параметрам user_phone, user_email
export const getUser = async (params = {}) => {
  const { user_phone, user_email } = params
  try {
    const url = `${omnideskUrl}/api/users.json`
    const response = await axios.get(url, {
      headers,
      auth,
      params: {
        ...(user_phone ? { user_phone } : {}),
        ...(user_email ? { user_email } : {})
      }
    })

    return Object.values(response.data).map((obj) => obj.user)
  } catch (error) {
    console.error("Ошибка при получении пользователя:", error.message)
    throw error
  }
}

// Получить пользователя по ID
export const getUserById = async (userId) => {
  try {
    const url = `${omnideskUrl}/api/users/${userId}.json`
    const response = await axios.get(url, { headers, auth })
    return response.data.user
  } catch (error) {
    console.error("Ошибка при получении пользователя по ID:", error.message)
    throw error
  }
}

// Создать пользователя
export const createUser = async (userData) => {
  if (!userData) {
    throw new Error("Некорректные данные:", userData)
  }
  try {
    const url = `${omnideskUrl}/api/users.json`
    const response = await axios.post(url, userData, { headers, auth })
    // Ожидаем, что будет { user: { ... } }
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

// Изменить пользователя (PUT /users/:id)
export const editUser = async (userId, userData) => {
  if (!userId) {
    throw new Error("Не передан userId для редактирования")
  }
  if (!userData) {
    throw new Error("Нет данных для редактирования пользователя")
  }
  try {
    const url = `${omnideskUrl}/api/users/${userId}.json`
    const response = await axios.put(url, userData, { headers, auth })
    return response.data.user
  } catch (error) {
    console.log("Ошибка при редактировании пользователя:", error.message)
    throw new Error(
      `Ошибка при редактировании пользователя: ${
        error.response?.data?.error || error.message
      }`
    )
  }
}

// Удалить пользователя
export const deleteUser = async (userId) => {
  try {
    const url = `${omnideskUrl}/api/users/${userId}.json`
    const response = await axios.delete(url, { headers, auth })
    return response.data
  } catch (error) {
    console.error("Ошибка при удалении пользователя:", error.message)
    throw error
  }
}

// Отвязать один userId от другого (PUT /users/:mainId/unlink.json)
export const unlinkUser = async (mainUserId, linkedUserId) => {
  const url = `${omnideskUrl}/api/users/${mainUserId}/unlink.json`
  const body = { user_id: linkedUserId }
  try {
    const response = await axios.put(url, body, { headers, auth })
    return response.data
  } catch (error) {
    console.error("Ошибка при отвязке пользователя:", error.message)
    throw error
  }
}

// Отвязка всех связанных пользователей
export const unlinkAllLinkedUsers = async (userId) => {
  if (!userId) {
    throw new Error("Не передан userId для отвязки связанных пользователей")
  }

  try {
    const user = await getUserById(userId)
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

    for await (const linkedUserId of user.linked_users) {
      console.log(`Отправка PUT-запроса для отвязки user_id=${linkedUserId}`)

      // Сформируем URL и body
      const unlinkUrl = `${omnideskUrl}/api/users/${userId}/unlink.json`
      const body = { user_id: linkedUserId }
      const config = { headers, auth }

      // Вызываем unlinkWithRetry по старой схеме
      const unlinkResponse = await unlinkWithRetry(unlinkUrl, body, config)
      console.log(
        `Пользователь ${linkedUserId} успешно отвязан от ${userId}.`,
        unlinkResponse.data
      )
    }

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
