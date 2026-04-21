import api from './api.service'

const uploadFile = async (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percent)
      }
    },
  })
  return response.data
}

const getFiles = async (params) => {
  const response = await api.get('/files', { params })
  return response.data
}

const getFileById = async (id) => {
  const response = await api.get(`/files/${id}`)
  return response.data
}

const downloadFile = async (id, fileName) => {
  const response = await api.get(`/files/${id}/download`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const deleteFile = async (id) => {
  const response = await api.delete(`/files/${id}`)
  return response.data
}

export default { uploadFile, getFiles, getFileById, downloadFile, deleteFile }