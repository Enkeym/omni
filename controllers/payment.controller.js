import { processFlow } from "../services/flow.service.js"

export const payment = (req, res) => {
  return processFlow(req, res, {
    isTestMode: false,
    subjectPrefix: "Продление",
    contentPrefix: "Дата продления",
    sendWhatsApp: false
  })
}
