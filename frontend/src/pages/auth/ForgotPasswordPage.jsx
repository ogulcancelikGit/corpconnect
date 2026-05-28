import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import authService from '../../services/auth.service'
import toast from 'react-hot-toast'
import { forgotPasswordSchema } from '../../schemas/auth.schema'

const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data) => {
    try {
      await authService.forgotPassword(data.email)
      setSentEmail(data.email)
      setSent(true)
      toast.success('Şifre sıfırlama maili gönderildi')
    } catch {
      toast.error('Bir hata oluştu')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 rounded-lg mb-4">
            <span className="text-white text-sm font-semibold tracking-tight">CC</span>
          </div>
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">Şifremi Unuttum</h1>
          <p className="text-sm text-gray-500 mt-1.5">Şifrenizi sıfırlayın</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {sent ? (
            <div className="text-center py-2">
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
                <CheckCircle2 size={18} strokeWidth={1.75} />
              </div>
              <p className="text-sm text-gray-700 mb-1">Mail gönderildi</p>
              <p className="text-xs text-gray-500 mb-5">
                <span className="font-medium text-gray-700">{sentEmail}</span> adresine şifre sıfırlama bağlantısı gönderildi.
              </p>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center bg-gray-900 text-white rounded-md py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Giriş sayfasına dön
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    className="w-full border border-gray-200 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                    placeholder="ad@sirket.com"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gray-900 text-white rounded-md py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Gönderiliyor...' : 'Sıfırlama Maili Gönder'}
              </button>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-1.5 border border-gray-200 rounded-md py-2.5 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={13} strokeWidth={1.75} /> Giriş sayfasına dön
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
