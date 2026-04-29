import React, { useState, useEffect, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import DiagnosisPage from './pages/DiagnosisPage'
import HistoryPage from './pages/HistoryPage'
import LoginPage from './pages/LoginPage'
import DisclaimerModal from './components/DisclaimerModal'
import { HistorySkeleton, DiagnosisSkeleton } from './components/Skeleton'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

// 页面切换过渡动画包装
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
}

function PageWrapper({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}

// 带过渡动画的路由
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route path="/diagnosis" element={
          <PageWrapper>
            <Suspense fallback={<DiagnosisSkeleton />}>
              <DiagnosisPage />
            </Suspense>
          </PageWrapper>
        } />
        <Route path="/history" element={
          <PageWrapper>
            <Suspense fallback={<HistorySkeleton />}>
              <HistoryPage />
            </Suspense>
          </PageWrapper>
        } />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('disclaimer_accepted')
    if (!accepted) setShowDisclaimer(true)
  }, [])

  const handleAccept = () => {
    localStorage.setItem('disclaimer_accepted', '1')
    setShowDisclaimer(false)
  }

  return (
    <>
      {showDisclaimer && <DisclaimerModal onAccept={handleAccept} />}
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <PrivateRoute>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <AnimatedRoutes />
                </main>
              </div>
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </>
  )
}

export default App
