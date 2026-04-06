import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import InputPage from './pages/InputPage'
import ResearchPage from './pages/ResearchPage'
import ResultsPage from './pages/ResultsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InputPage />} />
        <Route path="/research/:sessionId" element={<ResearchPage />} />
        <Route path="/results/:sessionId" element={<ResultsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
