/**
 * Очищает текст от тегов OmniDesk ([table], [tr], [th], [td])
 * и удаляет заголовок "ТоварСумма".
 * @param {string} text - Исходная строка.
 * @returns {string} Очищенная строка.
 */
/**
 * Очищает текст от OmniDesk тегов и удаляет лишний заголовок "ТоварСумма".
 * @param {string} text - Исходная строка.
 * @returns {string} Очищенная строка.
 */
export const cleanOmniNotes = (text) => {
  return text
    .replace(/\[\/?(table|tr|th|td)\]/g, "")
    .replace(/^\s*Товар\s*Сумма\s*/gim, "")
    .trim()
}
