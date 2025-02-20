import { processFlow } from "../services/flow.service.js"

export const payment = (req, res) => {
  return processFlow(req, res, {
    isTestMode: false,
    subjectPrefix: "Продление",
    contentPrefix: "Оплата успешно прошла ! WatsApp сообщение ",
    sendWhatsApp: false
  })
}
