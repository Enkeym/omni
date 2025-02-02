// utils/extractTarifText.js

/**
 * Извлекает текст между тегами [td] и [/td], оставляя каждый второй элемент,
 * затем объединяет в строку и заменяет кавычки «» на ".
 *
 * @param {string} tarif - Исходная строка тарифа.
 * @returns {string} Обработанный тариф.
 */
export const extractTarifText = (tarif) => {
  const matches = tarif.match(/\[td\](.*?)\[\/td\]/g) || []
  return matches
    .map((item) => item.replace(/\[\/?td\]/g, ""))
    .filter((_, index) => index % 2 === 0)
    .join("\n")
    .replace(/[«»]/g, '"')
}
