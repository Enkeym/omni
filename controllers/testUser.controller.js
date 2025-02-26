import { getUsersByMultipleFields } from "../utils/getUsersByMultipleFields.js"
import { parseRequest } from "../utils/parseRequest.js"

export const testUsers = async (req, res) => {
  try {
    const data = parseRequest(req.path)
    console.log(data)
    const { phone, email, contmail } = data

    if (!phone && !email && !contmail) {
      return res.status(400).json({
        error: "Нужно передать хотя бы один параметр (phone, email, contmail)"
      })
    }

    const users = await getUsersByMultipleFields({ phone, email, contmail })
    return res.json(users)
  } catch (error) {
    console.error(
      "Ошибка при тестировании поиска пользователей:",
      error.message
    )
    return res
      .status(500)
      .json({ error: "Ошибка сервера", details: error.message })
  }
}
