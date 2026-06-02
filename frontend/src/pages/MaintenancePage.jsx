import { useState } from 'react'
import { Wrench, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const MaintenancePage = ({ onRetry }) => {
  const { logout } = useAuth()
  const [checking, setChecking] = useState(false)

  const handleRetry = async () => {
    setChecking(true)
    const stillDown = await onRetry?.()
    setChecking(false)
    if (stillDown) {
      toast.error('Sistem hâlâ bakımda. Lütfen biraz sonra tekrar deneyin.')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-5 text-center px-6 bg-gray-50">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
        <Wrench size={28} className="text-amber-600" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold text-gray-800">Sistem bakımda</h1>
        <p className="text-gray-500 text-sm max-w-sm">
          Şu anda planlı bir bakım çalışması yapıyoruz. Lütfen daha sonra tekrar deneyin.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleRetry}
          disabled={checking}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {checking && <Loader2 size={14} className="animate-spin" />}
          {checking ? 'Kontrol ediliyor…' : 'Tekrar Dene'}
        </button>
        <button
          onClick={logout}
          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors"
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  )
}

export default MaintenancePage
