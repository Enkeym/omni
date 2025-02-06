import { processRegistration } from "../services/register.service.js"

export const registerTest = async (req, res) => {
  return processRegistration(req, res, true)
}
