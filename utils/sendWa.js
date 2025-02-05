// utils/sendWa.js
import { wazzupChannelId, wazzupToken } from "../config.js"
import { createLogger } from "./logger.js"

const logger = createLogger("WATSAPP")

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

/* export const sendWa = async (phone) => {
  const sanitizedPhone = phone.replace(/\D/g, "")

  //Сообщения для WatsApp
  const messages = [
    createMessagePayload(sanitizedPhone, text1),
    createMessagePayload(sanitizedPhone, text2)
  ]

  try {
    const responses = await Promise.all(
      messages.map((msg) => axios.post(wazzupUrl, msg, { headers }))
    )

    return responses.every((res) => res.status === 201 || res.status === 200)
      ? "отправлена ✔️"
      : "не отправлена ❌"
  } catch (error) {
    console.error(
      "Ошибка при отправке сообщений WhatsApp:",
      error.message,
      error.response ? error.response.data : ""
    )
    return "не отправлена ❌"
  }
} */

export const sendWa = async (phone) => {
  logger.info(`(МОК) WhatsApp сообщение для ${phone} не отправлено.`)
  return "не отправлена ❌"
}
