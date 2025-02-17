// utils/parseRequest.js
import { bitrixUrl } from "../config.js"

export const parseRequest = (path) => {
  let data = decodeURIComponent(path)
  data = data
    .replace(/^(\/?register-test|\/?register|\/?test)/, "")
    .replace(/^\|/, "")

  console.log("data:", JSON.stringify(data, 2, null))

  if (!data) {
    throw new Error("Пустое тело запроса")
  }

  const fields = data.split("|")
  if (fields.length !== 15) {
    throw new Error(
      `Неверное число элементов ${fields.length}, должно быть 15!`
    )
  }

  const [
    tid,
    surname,
    firstName,
    email,
    company,
    contname,
    phone,
    inn,
    contmail,
    tg,
    cat,
    role,
    tarif,
    comment,
    gs1
  ] = fields

  const dealUrl = `${bitrixUrl}/crm/deal/details/${tid}/`
  const cleanTarif = tarif.match(/тариф\s«([^»]+)»/)?.[1] || null
  const cleanNotes = tarif
    .replace(/\[\/?(?:table|tr|th|td)\]/g, "")
    .replace(/^\s*Товар\s*Сумма\s*/gim, "")
    .trim()

  return {
    tid,
    surname,
    firstName,
    email,
    company,
    contname,
    phone,
    inn,
    contmail,
    tg,
    cat,
    role,
    cleanTarif,
    comment,
    gs1,
    cleanNotes,
    dealUrl
  }
}
