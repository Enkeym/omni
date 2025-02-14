import axios from "axios"

// Пример: делаем 1 повтор через 5 секунд, если первый запрос упал
export async function unlinkWithRetry(
  url,
  body,
  config,
  retries = 5,
  delay = 5000
) {
  let attempt = 0

  while (true) {
    try {
      return await axios.put(url, body, config)
    } catch (error) {
      if (attempt >= retries) {
        throw error
      }

      console.warn(
        `Попытка №${attempt + 1} не удалась (${error.message}). ` +
          `Ждём ${delay / 1000} секунд и повторяем...`
      )

      await new Promise((resolve) => setTimeout(resolve, delay))

      attempt++
    }
  }
}
