import axios from "axios"

import { wazzupChannelId, wazzupToken, wazzupUrl } from "../config.js"

import { text1, text2 } from "./textMessages.js"

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${wazzupToken}`
}

const createMessagePayload = (phone, text) => ({
  channelId: wazzupChannelId,
  chatId: phone,
  chatType: "whatsapp",
  text
})

/**
 * Отправляет два сообщения через WhatsApp.
 * @param {string} phone - Номер телефона для отправки сообщения.
 * @returns {Promise<string>} Статус отправки сообщений.
 */
export const sendWa = async (phone) => {
  const sanitizedPhone = phone.replace(/\D/g, "") // Удаляем все нецифровые символы
  console.log(`📲 Отправка сообщений в WhatsApp на номер: ${sanitizedPhone}`)

  // Формируем сообщения
  const messages = [
    createMessagePayload(sanitizedPhone, text1),
    createMessagePayload(sanitizedPhone, text2)
  ]

  try {
    console.log("🚀 Начинаем отправку сообщений через Wazzup...")

    // Отправляем все сообщения параллельно
    const responses = await Promise.all(
      messages.map((msg) => axios.post(wazzupUrl, msg, { headers }))
    )

    // Проверяем, все ли сообщения успешно отправлены
    const allSuccessful = responses.every(
      (res) => res.status === 201 || res.status === 200
    )

    if (allSuccessful) {
      console.log("✅ Все сообщения успешно отправлены в WhatsApp.")
      return "отправлена ✔️"
    } else {
      console.warn("⚠️ Не все сообщения были отправлены успешно.")
      return "не отправлена ❌"
    }
  } catch (error) {
    console.error("❌ Ошибка при отправке сообщений WhatsApp:", error.message)

    if (error.response) {
      console.error(
        "📌 Детали ошибки:",
        JSON.stringify(error.response.data, null, 2)
      )
      console.error("📌 HTTP статус:", error.response.status)
    } else {
      console.error("📌 Нет ответа от сервера. Возможна проблема с сетью.")
    }

    return "не отправлена ❌"
  }
}
