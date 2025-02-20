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
      content: `
        <p><strong>Организация:</strong> ${data.company}</p>
        <p><strong>Контакт:</strong> ${data.phone} ${data.contname}</p>
        <p><strong>Категория:</strong> ${data.cat} ${data.role}</p>
        <p><strong>Тариф:</strong> ${data.cleanTarif}</p>
        ${contentPrefix ? `<p>${contentPrefix}: ${waStatus}</p>` : ""}
        <p><strong>Ссылка на заявку:</strong> <a href="${data.dealUrl}">${
        data.dealUrl
      }</a></p>
        ${data.gs1 === "Да" ? `<p>🌐 Регистрация в ГС1!</p>` : ""}
        ${
          data.comment
            ? `<p><strong>Комментарий:</strong> ${data.comment}</p>`
            : ""
        }`
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
