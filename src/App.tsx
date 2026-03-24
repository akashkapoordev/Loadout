import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import JobsPage from './pages/JobsPage'
import JobDetailPage from './pages/JobDetailPage'
import StudiosPage from './pages/StudiosPage'
import StudioDetailPage from './pages/StudioDetailPage'
import TutorialsPage from './pages/TutorialsPage'
import ArticlesPage from './pages/ArticlesPage'
import DevLogsPage from './pages/DevLogsPage'
import GuidesPage from './pages/GuidesPage'
import ContentDetailPage from './pages/ContentDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/studios" element={<StudiosPage />} />
          <Route path="/studios/:id" element={<StudioDetailPage />} />
          <Route path="/tutorials" element={<TutorialsPage />} />
          <Route path="/tutorials/:id" element={<ContentDetailPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:id" element={<ContentDetailPage />} />
          <Route path="/dev-logs" element={<DevLogsPage />} />
          <Route path="/dev-logs/:id" element={<ContentDetailPage />} />
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/guides/:id" element={<ContentDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
