// utils/logger.js

// ANSI коды цветов
const colors = {
  debug: "\x1b[34m", // синий
  info: "\x1b[32m", // зелёный
  warn: "\x1b[33m", // жёлтый
  error: "\x1b[31m", // красный
  reset: "\x1b[0m"
}

// Функция для получения текущего времени в формате "YYYY-MM-DD HH:mm:ss"
const getTimestamp = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// Функция для создания логгера с определенным контекстом (например, [REGISTER], [TEST])
export const createLogger = (context) => ({
  debug: (...args) => {
    console.log(
      `${colors.debug}${getTimestamp()} [${context}] [DEBUG]:${colors.reset}`,
      ...args
    )
  },
  info: (...args) => {
    console.log(
      `${colors.info}${getTimestamp()} [${context}] [INFO]:${colors.reset}`,
      ...args
    )
  },
  warn: (...args) => {
    console.warn(
      `${colors.warn}${getTimestamp()} [${context}] [WARN]:${colors.reset}`,
      ...args
    )
  },
  error: (...args) => {
    console.error(
      `${colors.error}${getTimestamp()} [${context}] [ERROR]:${colors.reset}`,
      ...args
    )
  }
})
