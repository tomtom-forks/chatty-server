export const MSG_CHARS_PRIVACY_LIMIT = 8

export const trimForPrivacy = (str: string, nrOfExtraChars = 0) => {
  return `${str.substring(0, MSG_CHARS_PRIVACY_LIMIT + nrOfExtraChars)}${
    str.length > MSG_CHARS_PRIVACY_LIMIT + nrOfExtraChars ? "..." : ""
  }`
}