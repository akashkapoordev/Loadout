import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { AuthProvider } from './context/AuthContext'

const HomePage          = lazy(() => import('./pages/HomePage'))
const JobsPage          = lazy(() => import('./pages/JobsPage'))
const JobDetailPage     = lazy(() => import('./pages/JobDetailPage'))
const StudiosPage       = lazy(() => import('./pages/StudiosPage'))
const StudioDetailPage  = lazy(() => import('./pages/StudioDetailPage'))
const TutorialsPage     = lazy(() => import('./pages/TutorialsPage'))
const ArticlesPage      = lazy(() => import('./pages/ArticlesPage'))
const DevLogsPage       = lazy(() => import('./pages/DevLogsPage'))
const GuidesPage        = lazy(() => import('./pages/GuidesPage'))
const ContentDetailPage = lazy(() => import('./pages/ContentDetailPage'))
const ForStudiosPage    = lazy(() => import('./pages/ForStudiosPage'))
const NotFoundPage      = lazy(() => import('./pages/NotFoundPage'))
const PremiumPage        = lazy(() => import('./pages/PremiumPage'))
const PremiumSuccessPage = lazy(() => import('./pages/PremiumSuccessPage'))
const PostAJobPage       = lazy(() => import('./pages/PostAJobPage'))
const PostAJobSuccessPage = lazy(() => import('./pages/PostAJobSuccessPage'))

function PageLoader() {
  return <div style={{ padding: 40, color: 'var(--muted)', fontFamily: 'var(--font-ui)', fontSize: 13 }}>Loading…</div>
}

export default function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/"              element={<HomePage />} />
            <Route path="/jobs"          element={<JobsPage />} />
            <Route path="/jobs/:id"      element={<JobDetailPage />} />
            <Route path="/studios"       element={<StudiosPage />} />
            <Route path="/studios/:id"   element={<StudioDetailPage />} />
            <Route path="/tutorials"     element={<TutorialsPage />} />
            <Route path="/tutorials/:id" element={<ContentDetailPage />} />
            <Route path="/articles"      element={<ArticlesPage />} />
            <Route path="/articles/:id"  element={<ContentDetailPage />} />
            <Route path="/dev-logs"      element={<DevLogsPage />} />
            <Route path="/dev-logs/:id"  element={<ContentDetailPage />} />
            <Route path="/guides"        element={<GuidesPage />} />
            <Route path="/guides/:id"    element={<ContentDetailPage />} />
            <Route path="/for-studios"   element={<ForStudiosPage />} />
            <Route path="/premium"              element={<PremiumPage />} />
            <Route path="/premium/success"     element={<PremiumSuccessPage />} />
            <Route path="/post-a-job"           element={<PostAJobPage />} />
            <Route path="/post-a-job/success"   element={<PostAJobSuccessPage />} />
            <Route path="*"              element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
    </AuthProvider>
  )
}
