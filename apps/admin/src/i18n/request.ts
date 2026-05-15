import { getRequestConfig } from "next-intl/server"

export default getRequestConfig(async () => {
  const common = (await import("@vettguard/i18n/messages/en/common.json")).default
  return { locale: "en", messages: { common } }
})
