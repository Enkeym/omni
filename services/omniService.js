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
 * Получает данные пользователя по заданным параметрам.
 * @param {Object} params - Параметры запроса (например, { user_phone: phone }).
 * @returns {Promise<Array>} - Список пользователей.
 */

export const getUser = async (params) => {
  const url = `${omnideskUrl}/api/users.json`
  const response = await axios.get(url, { headers, auth, params })
  return Object.values(response.data).map((userObj) => userObj.user)
}

/**
 * Создает нового пользователя в OmniDesk.
 * @param {Object} data - Данные пользователя.
 * @returns {Promise<Object>} - Данные нового пользователя.
 */

export const createUser = async (data) => {
  try {
    const url = `${omnideskUrl}/api/users.json`
    const response = await axios.post(url, data, { headers, auth })

    // Проверяем, что ответ содержит объект пользователя
    if (!response.data || !response.data.user || !response.data.user.user_id) {
      throw new Error("Некорректный ответ от OmniDesk")
    }

    return response.data.user // Возвращаем объект пользователя
  } catch (error) {
    console.error("❌ Ошибка при создании пользователя:", error.message)
    throw error // Пробрасываем ошибку выше
  }
}

/**
 * Удаляет всех старых пользователей перед добавлением нового.
 * @param {Array} users - Массив пользователей.
 * @returns {Promise<number>} - Количество удаленных пользователей.
 */

export const deleteUsers = async (users) => {
  let deletedCount = 0

  // Фильтруем только корректные объекты пользователей
  users = users.filter((user) => user && user.user_id)

  for (const user of users) {
    try {
      const url = `${omnideskUrl}/api/users/${user.user_id}.json`
      await axios.delete(url, { headers, auth })
      console.log(`✅ Пользователь (ID: ${user.user_id}) удален.`)
      deletedCount++
    } catch (error) {
      console.error(
        `❌ Ошибка при удалении пользователя (ID: ${user.user_id}):`,
        error.message
      )
    }
  }

  return deletedCount
}

/**
 * Удаляет все заявки пользователя, кроме последней.
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

    // Сортируем заявки по дате создания (от старых к новым)
    cases.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

    let deletedCount = 0
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
