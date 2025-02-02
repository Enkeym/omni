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
 * @returns {Promise} - Промис, возвращающий ответ от API.
 */

export const getUser = async (params) => {
  const url = `${omnideskUrl}/api/users.json`
  return axios.get(url, { headers, auth, params })
}

/**
 * Создает нового пользователя в OmniDesk.
 * @param {Object} data - Данные пользователя.
 * @returns {Promise} - Промис, возвращающий ответ от API.
 */

export const createUser = async (data) => {
  const url = `${omnideskUrl}/api/users.json`
  return axios.post(url, data, { headers, auth })
}

/**
 * Редактирует данные пользователя.
 * @param {string|number} userId - Идентификатор пользователя.
 * @param {Object} data - Новые данные для пользователя.
 * @returns {Promise} - Промис, возвращающий ответ от API.
 */

export const editUser = async (userId, data) => {
  const url = `${omnideskUrl}/api/users/${userId}.json`
  return axios.put(url, data, { headers, auth })
}
