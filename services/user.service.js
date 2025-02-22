import {
  createUser,
  editUser,
  getUser,
  unlinkAllLinkedUsers
} from "./omni.service.js"

export async function processUser(data) {
  // Поиск пользователя
  let existingUsers = []
  try {
    existingUsers = await getUser({
      user_phone: data.phone
    })
  } catch (error) {
    console.error("Ошибка при поиске пользователя:", error)
    throw new Error(`Ошибка на сервере: ${error.message}`)
  }

  existingUsers = existingUsers.filter((usr) => usr && usr.user_id)
  let mainUser = existingUsers.length > 0 ? existingUsers[0] : null

  // Удаление дубликатов
  if (existingUsers.length > 1) {
    const duplicates = existingUsers.slice(1)
    for await (const dup of duplicates) {
      if (!dup?.user_id) continue
      try {
        console.log(`Удаляем дубликат: user_id=${dup.user_id}`)
        await unlinkAllLinkedUsers(dup.user_id)
        console.log(`Очищаем номер телефона у дубликата ID=${dup.user_id}`)
        await editUser(dup.user_id, {
          user: {
            user_phone: "",
            user_screen_name: "",
            wa_id: "",
            type: ""
          }
        })
      } catch (err) {
        console.error("Ошибка удаления дубликата:", err.message)
      }
    }
  }

  // Данные для создания/обновления пользователя
  const userData = {
    user: {
      user_full_name: data.contname,
      company_name: data.company,
      company_position: data.inn,
      user_phone: data.phone,
      user_telegram: data.tg.replace("@", ""),
      user_note: data.cleanNotes
    }
  }

  // Создание или обновление
  try {
    if (!mainUser) {
      console.log("Пользователь не найден, создаём нового...")
      mainUser = await createUser(userData)
      console.log("Новый пользователь создан:", mainUser.user_id)
    } else {
      console.log(`Обновляем пользователя ID=${mainUser.user_id}...`)
      mainUser = await editUser(mainUser.user_id, userData)
      console.log("Пользователь обновлён:", mainUser.user_id)
    }
  } catch (err) {
    // Обработка "phone_already_exists"
    if (err.message.includes("phone_already_exists")) {
      console.error("Ошибка: телефон уже привязан к другому пользователю.")

      let existingPhoneUsers = []
      try {
        existingPhoneUsers = await getUser({ user_phone: data.phone })
        existingPhoneUsers = existingPhoneUsers.filter(
          (usr) => usr && usr.user_id
        )

        if (existingPhoneUsers.length > 1) {
          console.log(
            "Повторное обнаружение дубликатов по телефону:",
            existingPhoneUsers.map((u) => u.user_id)
          )

          let phoneMainUser = existingPhoneUsers[0]
          const phoneDuplicates = existingPhoneUsers.slice(1)

          for await (const dup of phoneDuplicates) {
            if (!dup?.user_id) continue
            try {
              console.log(`Отвязываем/очищаем дубликат user_id=${dup.user_id}`)
              await unlinkAllLinkedUsers(dup.user_id)
              await editUser(dup.user_id, {
                user: {
                  user_phone: "",
                  user_screen_name: "",
                  wa_id: "",
                  type: ""
                }
              })
            } catch (dupErr) {
              console.error(
                "Ошибка при очистке повторного дубликата (phone):",
                dupErr.message
              )
            }
          }

          try {
            phoneMainUser = await editUser(phoneMainUser.user_id, userData)
            console.log(
              "Повторное обновление «главного» пользователя (phone) завершено:",
              phoneMainUser.user_id
            )
            mainUser = phoneMainUser
          } catch (secondUpdateErr) {
            console.error(
              "Снова возникла ошибка при втором обновлении 'главного' пользователя (phone):",
              secondUpdateErr.message
            )

            try {
              console.log(
                "Принудительно очищаем поля 'главного' пользователя, которые могут конфликтовать с телефоном..."
              )
              await editUser(phoneMainUser.user_id, {
                user: {
                  user_phone: "",
                  user_screen_name: "",
                  wa_id: "",
                  type: ""
                }
              })

              console.log(
                "Поля очищены. Пробуем снова прописать нужный user_phone..."
              )
              phoneMainUser = await editUser(phoneMainUser.user_id, userData)
              console.log(
                "Повторное обновление 'главного' пользователя (phone) после очистки завершено:",
                phoneMainUser.user_id
              )
              mainUser = phoneMainUser
            } catch (forcedClearErr) {
              console.error(
                "Ошибка при принудительной очистке 'главного' пользователя (phone):",
                forcedClearErr.message
              )
            }
          }
        } else if (existingPhoneUsers.length === 1) {
          let phoneMainUser = existingPhoneUsers[0]
          try {
            console.log(
              `Пробуем ещё раз обновить пользователя ID=${phoneMainUser.user_id}...`
            )
            phoneMainUser = await editUser(phoneMainUser.user_id, userData)
            console.log("Обновление завершено (phone):", phoneMainUser.user_id)
            mainUser = phoneMainUser
          } catch (secondUpdateErr) {
            console.error(
              "Ошибка при втором обновлении единственного пользователя (phone):",
              secondUpdateErr.message
            )

            try {
              console.log("Принудительно очищаем 'главного' (phoneMainUser)...")
              await editUser(phoneMainUser.user_id, {
                user: {
                  user_phone: "",
                  user_screen_name: "",
                  wa_id: "",
                  type: ""
                }
              })

              phoneMainUser = await editUser(phoneMainUser.user_id, userData)
              console.log(
                "Обновление завершено (phone) после очистки:",
                phoneMainUser.user_id
              )
              mainUser = phoneMainUser
            } catch (forcedClearErr) {
              console.error(
                "Ошибка при принудительной очистке единственного пользователя (phone):",
                forcedClearErr.message
              )
            }
          }
        } else {
          console.warn(
            "Пользователь с таким номером телефона не найден при повторном поиске."
          )
        }
      } catch (findPhoneErr) {
        console.error(
          "Ошибка при повторном поиске пользователя по телефону:",
          findPhoneErr.message
        )
      }
    }

    // Обработка "email_already_exists"
    else if (err.message.includes("email_already_exists")) {
      console.error("Ошибка: email уже привязан к другому пользователю.")

      let existingEmailUsers = []
      try {
        existingEmailUsers = await getUser({ user_email: data.contmail })
        existingEmailUsers = existingEmailUsers.filter(
          (usr) => usr && usr.user_id
        )

        if (existingEmailUsers.length > 1) {
          console.log(
            "Повторное обнаружение дубликатов по email:",
            existingEmailUsers.map((u) => u.user_id)
          )
          let emailMainUser = existingEmailUsers[0]
          const emailDuplicates = existingEmailUsers.slice(1)

          for await (const dup of emailDuplicates) {
            if (!dup?.user_id) continue
            try {
              console.log(
                `Отвязываем/очищаем дубликат по email user_id=${dup.user_id}`
              )
              await unlinkAllLinkedUsers(dup.user_id)
              await editUser(dup.user_id, {
                user: {
                  user_email: "",
                  user_screen_name: "",
                  wa_id: "",
                  type: ""
                }
              })
            } catch (dupErr) {
              console.error(
                "Ошибка при очистке повторного дубликата email:",
                dupErr.message
              )
            }
          }

          try {
            emailMainUser = await editUser(emailMainUser.user_id, userData)
            console.log(
              "Повторное обновление «главного» пользователя (email) завершено:",
              emailMainUser.user_id
            )
            mainUser = emailMainUser
          } catch (secondUpdateErr) {
            console.error(
              "Снова возникла ошибка при втором обновлении 'главного' пользователя (email):",
              secondUpdateErr.message
            )
          }
        } else if (existingEmailUsers.length === 1) {
          let emailMainUser = existingEmailUsers[0]
          try {
            console.log(
              `Пробуем ещё раз обновить пользователя ID=${emailMainUser.user_id} по email...`
            )
            emailMainUser = await editUser(emailMainUser.user_id, userData)
            console.log("Обновление завершено (email):", emailMainUser.user_id)
            mainUser = emailMainUser
          } catch (secondUpdateErr) {
            console.error(
              "Ошибка при втором обновлении единственного пользователя (email):",
              secondUpdateErr.message
            )
          }
        } else {
          console.warn(
            "Пользователь с таким email не найден при повторном поиске."
          )
        }
      } catch (findEmailErr) {
        console.error(
          "Ошибка при повторном поиске пользователя по email:",
          findEmailErr.message
        )
      }
    } else {
      console.error("Ошибка при создании/обновлении пользователя:", err.message)
    }
  }
  return mainUser
}
