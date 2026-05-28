const express = require('express')
const router = express.Router()
const { getMyExpenses, getAllExpenses, getExpenseStats, createExpense, reviewExpense, cancelExpense } = require('../controllers/expense.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { validate } = require('../middleware/validate.middleware')
const { createExpenseValidation, reviewExpenseValidation } = require('../validations/expense.validation')
const { upload } = require('../middleware/upload.middleware')
const { success, error } = require('../utils/response.util')

router.use(authenticate)
router.get('/my', getMyExpenses)
router.get('/stats', authorize('ADMIN', 'MANAGER'), getExpenseStats)
router.get('/', authorize('ADMIN', 'MANAGER'), getAllExpenses)
router.post('/', createExpenseValidation, validate, createExpense)
router.put('/:id/review', authorize('ADMIN', 'MANAGER'), reviewExpenseValidation, validate, reviewExpense)
router.delete('/:id', cancelExpense)

// POST /api/expenses/receipt — fiş dosyası yükle, URL döndür
router.post('/receipt', upload.single('receipt'), (req, res) => {
  if (!req.file) return error(res, 'Dosya yüklenemedi', 400)
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.mimetype.startsWith('image/') ? 'images' : 'documents'}/${req.file.filename}`
  return success(res, { url: fileUrl }, 'Fiş yüklendi')
})

module.exports = router
