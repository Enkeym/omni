import { parseRequest } from "../utils/parseRequest"

export function name(req, res, options = {}) {
  const {
    subjectPrefix = "",
    contentPrefix = "",
    sendWhatsApp = false,
    isTestMode = false
  } = options

  try {
    const data = parseRequest(req.path)
    console.log("Обработанные данные:", data)
  } catch (error) {}
}
