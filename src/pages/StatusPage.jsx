import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"

const STAGES = ["pending", "approved", "deposit_paid", "in_progress", "ready", "completed"]

const STAGE_LABELS = {
  pending: "Request Received",
  approved: "Approved",
  deposit_paid: "Deposit Paid",
  in_progress: "In Progress",
  ready: "Ready for Pickup",
  completed: "Completed",
}

const STAGE_DESCRIPTIONS = {
  pending: "Your request has been received and is awaiting review.",
  approved: "Your request has been approved. Please pay your deposit to secure your slot.",
  deposit_paid: "Deposit received! Your item is in the queue.",
  in_progress: "Your item is currently being worked on.",
  ready: "Your item is ready for pickup!",
  completed: "Job complete. Thank you!",
}

export default function StatusPage() {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchBooking() {
      const { data, error } = await supabase
        .from("bookings")
        .select(`*, services (name, estimated_days)`)
        .eq("id", bookingId)
        .single()

      if (error || !data) {
        setError("Booking not found.")
      } else {
        setBooking(data)
      }

      setLoading(false)
    }

    fetchBooking()
  }, [bookingId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  const currentStageIndex = STAGES.indexOf(booking.status)

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Job Status</h1>
          <p className="text-gray-400 mt-1">Booking for {booking.customer_name}</p>
        </div>

        {/* Service Info */}
        <div className="bg-gray-800 rounded-xl px-6 py-4 mb-8">
          <p className="text-amber-400 font-semibold">{booking.services?.name}</p>
          <p className="text-gray-400 text-sm mt-1">
            Est. {booking.services?.estimated_days} days turnaround
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Submitted {new Date(booking.submitted_at).toLocaleDateString()}
          </p>
        </div>

        {/* Status Tracker */}
        <div className="space-y-4 mb-8">
          {STAGES.map((stage, index) => {
            const isCompleted = index < currentStageIndex
            const isCurrent = index === currentStageIndex
            const isFuture = index > currentStageIndex

            return (
              <div key={stage} className="flex items-start gap-4">
                {/* Circle */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                    ${isCompleted ? "bg-amber-600 text-white" : ""}
                    ${isCurrent ? "bg-amber-500 text-white ring-4 ring-amber-500 ring-opacity-30" : ""}
                    ${isFuture ? "bg-gray-700 text-gray-500" : ""}
                  `}>
                    {isCompleted ? "✓" : index + 1}
                  </div>
                  {index < STAGES.length - 1 && (
                    <div className={`w-0.5 h-8 mt-1 ${isCompleted ? "bg-amber-600" : "bg-gray-700"}`} />
                  )}
                </div>

                {/* Label */}
                <div className="pt-1">
                  <p className={`font-medium ${isCurrent ? "text-amber-400" : isFuture ? "text-gray-500" : "text-white"}`}>
                    {STAGE_LABELS[stage]}
                  </p>
                  {isCurrent && (
                    <p className="text-gray-400 text-sm mt-0.5">
                      {STAGE_DESCRIPTIONS[stage]}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Deposit link if approved and not yet paid */}
        {booking.status === "approved" && booking.stripe_payment_link && (
          <a
            href={booking.stripe_payment_link}
            target="_blank"
            rel="noreferrer"
            className="block w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 rounded-lg text-center transition-colors"
          >
            Pay ${booking.deposit_amount} Deposit →
          </a>
        )}

      </div>
    </div>
  )
}