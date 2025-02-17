// utils/unlinkWithRetry.js
import axios from "axios"

export async function unlinkWithRetry(
  url,
  body,
  config,
  maxRetries = 5,
  fallbackBaseDelay = 10000
) {
  let attempt = 0

  while (true) {
    try {
      return await axios.put(url, body, config)
    } catch (error) {
      attempt++
      const isTooManyRequests = error?.response?.status === 429

      if (attempt > maxRetries) {
        throw error
      }

      let delayMs = 0

      if (isTooManyRequests) {
        const retryHeader = error.response.headers["retry_after"] || "20"
        const retryAfterSec = parseInt(retryHeader, 10) || 20
        delayMs = retryAfterSec * 1000
        console.warn(
          `Попытка №${attempt}. Сервер вернул 429: Too Many Requests. Ждём ${retryAfterSec} сек. и повторяем...`
        )
      } else {
        delayMs = fallbackBaseDelay * Math.pow(2, attempt - 1)
        console.warn(
          `Попытка №${attempt}. Ошибка: ${error.message}. Ждём ${
            delayMs / 1000
          } сек. и повторяем...`
        )
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}
