//utils/sendWa.js
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

// Отправляет два сообщения через WatsApp
export const sendWa = async (phone) => {
  const sanitizedPhone = phone.replace(/\D/g, "")
  console.log(`📲 Отправка сообщений в WhatsApp на номер: ${sanitizedPhone}`)

  const message1 = createMessagePayload(sanitizedPhone, text1)
  const message2 = createMessagePayload(sanitizedPhone, text2)

  try {
    console.log("🚀 Начинаем отправку сообщений через Wazzup...")

    const response1 = await axios.post(wazzupUrl, message1, { headers })
    if (response1.status !== 201 && response1.status !== 200) {
      console.warn(
        "Первое сообщение не отправлено:",
        response1.status,
        response1.statusText
      )
      return "не отправлена ❌"
    }

    const response2 = await axios.post(wazzupUrl, message2, { headers })
    if (response2.status !== 201 && response2.status !== 200) {
      console.warn(
        "Второе сообщение не отправлено:",
        response2.status,
        response2.statusText
      )
      return "не отправлена ❌"
    }

    console.log("✅ Оба сообщения успешно отправлены в WhatsApp.")
    return "отправлена ✔️"
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
