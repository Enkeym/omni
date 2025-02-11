// services/omniService.js
import axios from "axios"

import { omnideskApiKey, omnideskEmail, omnideskUrl } from "../config.js"

// Общие настройки для всех запросов
const headers = { "Content-Type": "application/json" }
const auth = {
  username: omnideskEmail,
  password: omnideskApiKey
}

/**
 * Создает новую заявку (case) в OmniDesk.
 * @param {Object} data - Данные заявки.
 * @returns {Promise} - Промис, возвращающий ответ от API.
 */
export const postCase = async (data) => {
  const url = `${omnideskUrl}/api/cases.json`
  return axios.post(url, data, { headers, auth })
}

/**
 * Получает данные пользователя по заданным параметрам (phone, email, etc.).
 * @param {Object} params - Параметры запроса, например { user_phone: phone }
 * @returns {Promise<Array>} - Список пользователей (массив).
 */
export const getUser = async (params) => {
  const url = `${omnideskUrl}/api/users.json`
  const response = await axios.get(url, { headers, auth, params })
  return Object.values(response.data).map((userObj) => userObj.user)
}

/**
 * Создает нового пользователя в OmniDesk.
 * @param {Object} data - Данные пользователя { user: { ... } }
 * @returns {Promise<Object>} - Объект созданного пользователя.
 */
export const createUser = async (data) => {
  try {
    const url = `${omnideskUrl}/api/users.json`
    const response = await axios.post(url, data, { headers, auth })

    // Проверяем, что ответ содержит корректный объект
    if (!response.data || !response.data.user || !response.data.user.user_id) {
      throw new Error("Некорректный ответ от OmniDesk")
    }

    return response.data.user
  } catch (error) {
    console.error("❌ Ошибка при создании пользователя:", error.message)
    throw error
  }
}

/**
 * Удаляет всех указанных пользователей (из массива users) в цикле.
 * @param {Array} users - Массив объектов пользователей { user_id: ... }.
 * @returns {Promise<number>} - Количество фактически удаленных пользователей.
 */
export const deleteUsers = async (users) => {
  let deletedCount = 0
  users = users.filter((user) => user && user.user_id)

  for (const user of users) {
    try {
      const url = `${omnideskUrl}/api/users/${user.user_id}.json`
      const response = await axios.delete(url, { headers, auth })
      console.log(
        `✅ Ответ сервера при удалении пользователя (ID: ${user.user_id}):`,
        response.status
      )
      deletedCount++
    } catch (error) {
      console.error(
        `❌ Ошибка при удалении пользователя (ID: ${user.user_id}):`,
        error.message
      )
      if (error.response) {
        console.error(
          "📌 Детали ошибки:",
          JSON.stringify(error.response.data, null, 2)
        )
        console.error("📌 HTTP статус:", error.response.status)
      }
    }
  }

  return deletedCount
}

/**
 * Удаляет все заявки (cases) пользователя, кроме последней.
 * @param {string|number} userId - ID пользователя.
 * @returns {Promise<number>} - Количество удаленных заявок.
 */
export const deleteOldCases = async (userId) => {
  try {
    const response = await axios.get(`${omnideskUrl}/api/cases.json`, {
      params: { user_id: userId },
      headers,
      auth
    })

    const cases = response.data.cases || []
    if (cases.length <= 1) {
      console.log("✅ Заявок меньше двух, ничего не удаляем.")
      return 0
    }

    // Сортируем по дате создания (от старых к новым)
    cases.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

    let deletedCount = 0
    // Удаляем все, кроме самого последнего
    for (let i = 0; i < cases.length - 1; i++) {
      await axios.delete(`${omnideskUrl}/api/cases/${cases[i].case_id}.json`, {
        headers,
        auth
      })
      deletedCount++
    }

    return deletedCount
  } catch (error) {
    throw new Error(`❌ Ошибка при удалении заявок: ${error.message}`)
  }
}

/**
 * Удаляет ВСЕ кейсы пользователя (полная очистка обращений).
 * @param {string|number} userId - ID пользователя.
 */
export const deleteAllCases = async (userId) => {
  try {
    const response = await axios.get(`${omnideskUrl}/api/cases.json`, {
      params: { user_id: userId },
      headers,
      auth
    })

    const cases = response.data.cases || []
    console.log(`🔹 Найдено кейсов у пользователя ${userId}:`, cases.length)

    for (const c of cases) {
      await axios.delete(`${omnideskUrl}/api/cases/${c.case_id}.json`, {
        headers,
        auth
      })
      console.log(`✅ Удалён кейс (case_id=${c.case_id})`)
    }
  } catch (error) {
    console.error(
      `❌ Ошибка при удалении всех кейсов пользователя ${userId}:`,
      error.message
    )
    throw error
  }
}

/**
 * Удаляет одного пользователя по ID (без дополнительных проверок).
 * @param {string|number} userId - ID пользователя в OmniDesk.
 */
export const deleteSingleUser = async (userId) => {
  try {
    const url = `${omnideskUrl}/api/users/${userId}.json`
    const response = await axios.delete(url, { headers, auth })
    console.log(`✅ Удалён пользователь ID=${userId}, статус:`, response.status)
  } catch (error) {
    console.error(
      `❌ Ошибка при удалении пользователя ID=${userId}:`,
      error.message
    )
    if (error.response) {
      console.error(
        "📌 Детали ошибки:",
        JSON.stringify(error.response.data, null, 2)
      )
      console.error("📌 HTTP статус:", error.response.status)
    }
    throw error
  }
}
