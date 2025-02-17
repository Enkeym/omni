// utils/unlinkWithRetry.js
import axios from "axios"

export async function unlinkWithRetry(
  url,
  body,
  config,
  maxRetries = 5,
  baseDelay = 10000
) {
  let attempt = 0
  while (true) {
    try {
      return await axios.put(url, body, config)
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error
      }
      attempt++

      const delayMs = baseDelay * Math.pow(2, attempt - 1)
      console.warn(
        `Попытка №${attempt} не удалась (${error.message}). Ждём ${
          delayMs / 1000
        } секунд и повторяем...`
      )
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}
