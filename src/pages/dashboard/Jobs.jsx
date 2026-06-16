import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

const STATUS_FLOW = {
  deposit_paid: { label: "Deposit Paid", next: "in_progress", nextLabel: "Start Job" },
  in_progress: { label: "In Progress", next: "ready", nextLabel: "Mark Ready for Pickup" },
  ready: { label: "Ready for Pickup", next: "completed", nextLabel: "Mark Completed" },
  completed: { label: "Completed", next: null, nextLabel: null },
}

const STATUS_COLORS = {
  deposit_paid: "bg-blue-900 text-blue-300",
  in_progress: "bg-amber-900 text-amber-300",
  ready: "bg-green-900 text-green-300",
  completed: "bg-gray-700 text-gray-400",
}

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchJobs() {
      const { data: { session } } = await supabase.auth.getSession()

      const { data: shop, error: shopError } = await supabase
        .from("shops")
        .select("id")
        .eq("owner_id", session.user.id)
        .single()

      if (shopError || !shop) {
        setError("Could not load shop.")
        setLoading(false)
        return
      }

      const { data, error: jobError } = await supabase
        .from("bookings")
        .select(`*, services (name)`)
        .eq("shop_id", shop.id)
        .in("status", ["deposit_paid", "in_progress", "ready", "completed"])
        .order("updated_at", { ascending: false })

      if (jobError) {
        setError("Could not load jobs.")
      } else {
        setJobs(data)
      }

      setLoading(false)
    }

    fetchJobs()
  }, [])

  async function handleAdvanceStatus(job) {
    const nextStatus = STATUS_FLOW[job.status]?.next
    if (!nextStatus) return

    const { error } = await supabase
      .from("bookings")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id)

    if (!error) {
      setJobs(prev =>
        prev.map(j => j.id === job.id ? { ...j, status: nextStatus } : j)
      )
    }
  }

  if (loading) return <p className="text-gray-400">Loading jobs...</p>
  if (error) return <p className="text-red-400">{error}</p>

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">No active jobs.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {jobs.map(job => {
        const flow = STATUS_FLOW[job.status]
        const colorClass = STATUS_COLORS[job.status]

        return (
          <div key={job.id} className="bg-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold">{job.customer_name}</h3>
                <p className="text-amber-400 text-sm">{job.services?.name}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${colorClass}`}>
                {flow?.label}
              </span>
            </div>

            <div className="text-sm text-gray-400 space-y-1 mb-4">
              <p>📧 {job.customer_email}</p>
              {job.customer_phone && <p>📞 {job.customer_phone}</p>}
              {job.notes && (
                <p className="text-gray-500 mt-2 italic">"{job.notes}"</p>
              )}
            </div>

            <div className="flex justify-between items-center">
              
                href={`/status/${job.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-gray-500 hover:text-amber-400 transition-colors"
              >
                View status page →
              </a>

              {flow?.next && (
                <button
                  onClick={() => handleAdvanceStatus(job)}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  {flow.nextLabel}
                </button>
              )}

              {!flow?.next && (
                <span className="text-gray-600 text-sm">Job complete</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}