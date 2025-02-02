// config.js
import "dotenv/config"

const port = process.env.PORT ? parseInt(process.env.PORT) : 80

// Omnidesk
const omnideskUrl = process.env.OMNIDESK_URL
const omnideskApiKey = process.env.OMNIDESK_APIKEY
const omnideskEmail = process.env.OMNIDESK_EMAIL

//Bitrix
const bitrixUrl = process.env.BITRIX_URL

//WatsApp
const wazzupUrl = process.env.WAZZUP_URL
const wazzupChannelId = process.env.WAZZUP_CHANNEL_ID
const wazzupToken = process.env.WAZZUP_TOKEN

export {
  bitrixUrl,
  omnideskApiKey,
  omnideskEmail,
  omnideskUrl,
  port,
  wazzupChannelId,
  wazzupToken,
  wazzupUrl
}
