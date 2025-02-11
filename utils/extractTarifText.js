// utils/extractTarifText.js

/**
 * Извлекает текст между тегами [td] и [/td], оставляя каждый второй элемент,
 * затем объединяет в строку и заменяет кавычки «» на ".
 *
 * @param {string} tarif - Исходная строка тарифа.
 * @returns {string} Обработанный тариф.
 */
/**
 * Извлекает текст тарифа (название + цена) из HTML-like структуры OmniDesk.
 * @param {string} tarif - Исходная строка с тарифом.
 * @returns {string} Чистый текст тарифа.
 */
export const extractTarifText = (tarif) => {
  // Находим все [td] элементы
  const matches = tarif.match(/\[td\](.*?)\[\/td\]/g) || []

  // Извлекаем текст без тегов
  const cleanedItems = matches.map((item) =>
    item.replace(/\[\/?td\]/g, "").trim()
  )

  // Ищем индекс ячейки, содержащей слово "тариф"
  const tarifIndex = cleanedItems.findIndex((item) =>
    item.toLowerCase().includes("тариф")
  )

  if (tarifIndex === -1 || tarifIndex + 1 >= cleanedItems.length) {
    return "Не найдено"
  }

  // Склеиваем тариф и цену, заменяя кавычки «» на "
  return `${cleanedItems[tarifIndex]} (${
    cleanedItems[tarifIndex + 1]
  })`.replace(/[«»]/g, '"')
}
