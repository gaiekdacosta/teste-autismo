/**
 * Utilitários de telefone compartilhados pelos fluxos de cadastro,
 * configuração e complemento de perfil.
 */

/** Retorna apenas os dígitos do número informado. */
export function getPhoneDigits(phone: string) {
  return phone.replace(/\D/g, '')
}

/** Normaliza o número para o formato E.164 brasileiro (+55...). */
export function normalizePhone(phone: string) {
  const onlyNumbers = getPhoneDigits(phone)

  if (onlyNumbers.startsWith('55')) {
    return `+${onlyNumbers}`
  }

  return `+55${onlyNumbers}`
}

/** Valida a quantidade de dígitos do número (mesma regra do cadastro). */
export function isValidPhone(phone: string) {
  const digits = getPhoneDigits(phone)
  return digits.length >= 10 && digits.length <= 13
}
