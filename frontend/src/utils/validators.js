export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const isValidPassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)
}

export const isValidPhone = (phone) => {
  return /^[+]?[\d\s-]{10,}$/.test(phone)
}