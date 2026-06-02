import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import authService from '../../services/auth.service'
import toast from 'react-hot-toast'
import { resetPasswordSchema } from '../../schemas/auth.schema'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm: '' },
  })

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Geçersiz veya eksik token')
      return
    }
    try {
      await authService.resetPassword({ token, password: data.password })
      toast.success('Şifre sıfırlandı, giriş yapabilirsiniz')
      navigate('/login')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Şifre sıfırlanamadı')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 rounded-lg mb-4">
            <span className="text-white text-sm font-semibold tracking-tight">CC</span>
          </div>
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">Şifre Sıfırla</h1>
          <p className="text-sm text-gray-500 mt-1.5">Yeni şifrenizi belirleyin</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Yeni Şifre</label>
              <div className="relative">
                <Lock size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="En az 8 karakter"
                  className="w-full border border-gray-200 rounded-md pl-9 pr-9 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Yeni Şifre Tekrar</label>
              <div className="relative">
                <Lock size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Şifrenizi tekrar girin"
                  className="w-full border border-gray-200 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  {...register('confirm')}
                />
              </div>
              {errors.confirm && (
                <p className="text-xs text-red-500 mt-1">{errors.confirm.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gray-900 text-white rounded-md py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Sıfırlanıyor...' : 'Şifreyi Sıfırla'}
            </button>

            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-1.5 border border-gray-200 rounded-md py-2.5 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={13} strokeWidth={1.75} /> Giriş sayfasına dön
            </Link>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
