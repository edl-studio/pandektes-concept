import { Route, Routes } from 'react-router-dom'
import { CaseListPage } from '@/pages/CaseListPage'
import { CaseDetailPage } from '@/pages/CaseDetailPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CaseListPage />} />
      <Route path="/case/:id" element={<CaseDetailPage />} />
    </Routes>
  )
}
