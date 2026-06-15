import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { supabase } from "./lib/supabase"
import BookingPage from "./pages/BookingPage"
import Login from "./pages/Login"
import Requests from "./pages/dashboard/Requests"
import StatusPage from "./pages/StatusPage"

function DashboardLayout({ session }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Nav */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">CraftDesk</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{session.user.email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Pending Requests</h2>
        <Requests />
      </main>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public booking page */}
        <Route path="/book/:slug" element={<BookingPage />} />

        {/* Login - redirect to dashboard if already logged in */}
        <Route
          path="/login"
          element={session ? <Navigate to="/dashboard" /> : <Login />}
        />

        {/* Dashboard - redirect to login if not logged in */}
       <Route
        path="/dashboard"
        element={session ? <DashboardLayout session={session} /> : <Navigate to="/login" />}
/>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/status/:bookingId" element={<StatusPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App