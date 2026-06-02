import { useState, useEffect, useCallback } from 'react'
import api from '../services/api.service'
import MaintenancePage from '../pages/MaintenancePage'

// Normal kullanıcı (MANAGER/EMPLOYEE) layout'unu sarar.
// Bakım modu açıkken çalışana kırık uygulama yerine "Sistem bakımda" sayfasını gösterir.
// ADMIN bu kapıdan geçmez (kendi /superadmin layout'unu kullanır), dolayısıyla etkilenmez.
const MaintenanceGate = ({ children }) => {
  const [maintenance, setMaintenance] = useState(false)

  const check = useCallback(async () => {
    try {
      const res = await api.get('/maintenance')
      const still = !!res.data?.data?.maintenance
      setMaintenance(still)
      return still
    } catch {
      // Durum sorgulanamazsa engelleme
      setMaintenance(false)
      return false
    }
  }, [])

  useEffect(() => {
    check()
    // Herhangi bir API çağrısı 503/maintenance dönerse anında kapıyı kapat
    const onMaintenance = () => setMaintenance(true)
    window.addEventListener('app:maintenance', onMaintenance)
    return () => window.removeEventListener('app:maintenance', onMaintenance)
  }, [check])

  if (maintenance) {
    return <MaintenancePage onRetry={check} />
  }

  return children
}

export default MaintenanceGate
