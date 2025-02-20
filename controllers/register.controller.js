import { processFlow } from "../services/flow.service.js"

export const register = (req, res) => {
  return processFlow(req, res, {
    isTestMode: false,
    subjectPrefix: "Регистрация",
    contentPrefix: "Инструкция",
    sendWhatsApp: true
  })
}

export const registerTest = (req, res) => {
  return processFlow(req, res, {
    isTestMode: true,
    subjectPrefix: "Регистрация (тест)",
    contentPrefix: "Инструкция",
    sendWhatsApp: true
  })
}
