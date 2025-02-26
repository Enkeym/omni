// services/omni.service.js
import axios from "axios"

import { omnideskApiKey, omnideskEmail, omnideskUrl } from "../config.js"
import { tryWithRetry } from "../utils/tryWithRetry.js"

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

export const getUserById = async (userId) => {
  const url = `${omnideskUrl}/api/users/${userId}.json`
  const response = await axios.get(url, { headers, auth })
  return response.data.user
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

export const deleteAllLinkedUsers = async (userId) => {
  if (!userId) {
    throw new Error("Не передан userId для удаления связанных пользователей")
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
      `Найдено ${user.linked_users.length} связанных пользователей. Начинаем полное удаление...`
    )

    for await (const linkedUserId of user.linked_users) {
      const deleteUrl = `${omnideskUrl}/api/users/${linkedUserId}.json`
      console.log(
        `Отправка DELETE-запроса для удаления user_id=${linkedUserId}`
      )
      const deleteResponse = await tryWithRetry(deleteUrl, { headers, auth })
      console.log(
        `Пользователь ${linkedUserId} успешно удалён.`,
        deleteResponse.data
      )
    }

    console.log(
      `Все связанные пользователи (${user.linked_users.length} шт.) удалены.`
    )
  } catch (error) {
    console.error(
      `Ошибка при удалении связанных пользователей от ${userId}:`,
      error.response?.data || error.message
    )
    throw error
  }
}
