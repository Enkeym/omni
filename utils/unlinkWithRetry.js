import axios from "axios"

// Пример: делаем 1 повтор через 5 секунд, если первый запрос упал
export async function unlinkWithRetry(url, body, config) {
  try {
    // Первая попытка
    return await axios.put(url, body, config)
  } catch (error) {
    console.warn(
      `Первая попытка не удалась (${error.message}). Ждём 5 секунд и повторяем...`
    )
    await new Promise((resolve) => setTimeout(resolve, 5000))

    // Вторая попытка
    return axios.put(url, body, config)
  }
}
