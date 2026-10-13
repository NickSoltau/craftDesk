import { useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabase"

// Public demo account (same login shown in the README and portfolio).
const DEMO_EMAIL = "Mike@mikesgloves.com"
const DEMO_PASSWORD = "Mike123"
const DEMO_BOOKING_PATH = "/book/mikes-glove-shop"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  function fillDemoLogin() {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">CraftDesk</h1>
          <p className="text-gray-400 mt-1">Shop owner login</p>
        </div>

        {error && (
          <div className="bg-red-900 text-red-200 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="mike@mikesgloves.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-colors mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Demo guide: shown to anyone who lands here from a resume, README, or portfolio */}
        <section
          aria-labelledby="demo-guide-title"
          className="mt-8 border border-gray-700 rounded-lg p-5 bg-gray-800/50"
        >
          <h2 id="demo-guide-title" className="text-lg font-semibold">
            New here? Take the 2-minute tour
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            CraftDesk is a live demo for a small repair shop. Follow these steps to see
            the whole booking journey.
          </p>

          <ol className="mt-4 space-y-4 text-sm text-gray-300 list-decimal list-inside">
            <li>
              <span className="font-medium text-white">Book as a customer.</span> No login
              needed. Fill out the form and submit it.
              <Link
                to={DEMO_BOOKING_PATH}
                className="block mt-2 text-center border border-amber-600 text-amber-500 hover:bg-amber-600 hover:text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Open the customer booking page
              </Link>
            </li>
            <li>
              <span className="font-medium text-white">Log in as the shop owner.</span>{" "}
              Use the demo account, or fill it in with one click.
              <span className="block mt-1 text-gray-400">
                Email: {DEMO_EMAIL} <br />
                Password: {DEMO_PASSWORD}
              </span>
              <button
                type="button"
                onClick={fillDemoLogin}
                className="block w-full mt-2 border border-gray-600 hover:border-amber-500 text-gray-200 font-semibold py-2 rounded-lg transition-colors"
              >
                Fill in the demo login
              </button>
            </li>
            <li>
              <span className="font-medium text-white">Approve the request.</span> It shows up
              under Pending Requests. Approving it creates a Stripe payment link.
            </li>
            <li>
              <span className="font-medium text-white">Track the job.</span> In Active Jobs,
              move it through Deposit Paid, In Progress, Ready for Pickup, and Completed.
            </li>
          </ol>

          <p className="mt-4 text-xs text-gray-400">
            Payments run in Stripe test mode, so no real charges. Pay with card 4242 4242 4242
            4242, any future expiry, any 3-digit CVC, and any 5-digit ZIP.
          </p>
        </section>
      </div>
    </div>
  )
}
