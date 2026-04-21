export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const isImage = (mimeType) => mimeType?.startsWith('image/')
export const isVideo = (mimeType) => mimeType?.startsWith('video/')
export const isPdf = (mimeType) => mimeType === 'application/pdf'