import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { tr } from 'date-fns/locale'

export const formatDate = (date) => {
  return format(new Date(date), 'dd MMM yyyy', { locale: tr })
}

export const formatDateTime = (date) => {
  return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: tr })
}

export const formatTime = (date) => {
  return format(new Date(date), 'HH:mm', { locale: tr })
}

export const formatRelative = (date) => {
  const d = new Date(date)
  if (isToday(d)) return formatTime(d)
  if (isYesterday(d)) return 'Dün'
  return formatDate(d)
}

export const formatTimeAgo = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: tr })
}