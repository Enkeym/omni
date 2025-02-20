import { createCase } from "./omni.service.js"

export async function processCase(
  data,
  subjectPrefix,
  contentPrefix,
  waStatus
) {
  const caseData = {
    case: {
      user_email: data.email,
      status: "open",
      content_type: "html",
      user_full_name: `${data.surname} ${data.firstName}`,
      subject: `${subjectPrefix}. ${data.company} - ${Date.now()}`,
      content: `Организация: ${data.company}
  Контакт: ${data.phone} ${data.contname}
  Категория: ${data.cat} ${data.role}
  Тариф: ${data.cleanTarif}
  ${contentPrefix ? contentPrefix + ": " : ""}${waStatus}
  Ссылка на заявку: ${data.dealUrl}
  ${data.gs1 === "Да" ? "🌐 Регистрация в ГС1!" : ""}
  ${data.comment ? "❗ Комментарий: " + data.comment : ""}`
    }
  }

  console.log("Создаём кейс...", JSON.stringify(caseData, null, 2))
  try {
    const newCase = await createCase(caseData)
    console.log("Кейс успешно создан:", newCase)
  } catch (err) {
    console.error("Ошибка при создании кейса:", err.message)
    throw err
  }
}
