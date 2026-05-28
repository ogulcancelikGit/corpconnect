import api from './api.service'

const getMyExpenses = (params) => api.get('/expenses/my', { params }).then((r) => r.data)
const getAllExpenses = (params) => api.get('/expenses', { params }).then((r) => r.data)
const getExpenseStats = () => api.get('/expenses/stats').then((r) => r.data)
const createExpense = (data) => api.post('/expenses', data).then((r) => r.data)
const reviewExpense = (id, data) => api.put(`/expenses/${id}/review`, data).then((r) => r.data)
const cancelExpense = (id) => api.delete(`/expenses/${id}`).then((r) => r.data)

const uploadReceipt = (file) => {
  const form = new FormData()
  form.append('receipt', file)
  return api.post('/expenses/receipt', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
}

export default { getMyExpenses, getAllExpenses, getExpenseStats, createExpense, reviewExpense, cancelExpense, uploadReceipt }
