import { processRegistration } from "../services/register.service.js"

export const register = async (req, res) => {
  return processRegistration(req, res, false)
}
