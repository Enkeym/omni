/**
 * Очищает текст от тегов OmniDesk ([table], [tr], [th], [td])
 * и удаляет заголовок "ТоварСумма".
 * @param {string} text - Исходная строка.
 * @returns {string} Очищенная строка.
 */
export const cleanOmniNotes = (text) => {
  return text
    .replace(/\[\/?(table|tr|th|td)\]/g, "")
    .replace(/^Товар\s*Сумма\s*/i, "")
    .trim()
}
