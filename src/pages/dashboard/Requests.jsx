import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function Requests() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchBookings() {
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

      const { data, error: bookingError } = await supabase
        .from("bookings")
        .select(`
          *,
          services (name),
          booking_photos (storage_url)
        `)
        .eq("shop_id", shop.id)
        .eq("status", "pending")
        .order("submitted_at", { ascending: false })

      if (bookingError) {
        setError("Could not load bookings.")
      } else {
        setBookings(data)
      }

      setLoading(false)
    }

    fetchBookings()
  }, [])

  async function handleApprove(booking) {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(
      `https://kryjxqmasidpnvtwppgf.supabase.co/functions/v1/create-payment-link`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: booking.deposit_amount,
          customerEmail: booking.customer_email,
          customerName: booking.customer_name,
          serviceName: booking.services?.name,
          shopName: "Mikes Glove Shop",
        }),
      }
    )

    const data = await response.json()

    if (data.error) {
      alert("Error creating payment link: " + data.error)
      return
    }

    const { error } = await supabase
      .from("bookings")
      .update({
        status: "approved",
        stripe_payment_link: data.url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id)

    if (!error) {
      setBookings(prev => prev.filter(b => b.id !== booking.id))
      alert(`Payment link created!\n\n${data.url}\n\nIn production this will be emailed to the customer automatically.`)
    }
  } catch (err) {
    alert("Something went wrong: " + err.message)
  }
}

  async function handleDecline(booking) {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", booking.id)

    if (!error) {
      setBookings(prev => prev.filter(b => b.id !== booking.id))
    }
  }

  if (loading) {
    return <p className="text-gray-400">Loading requests...</p>
  }

  if (error) {
    return <p className="text-red-400">{error}</p>
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">No pending requests.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {bookings.map(booking => (
        <div key={booking.id} className="bg-gray-800 rounded-xl p-6">

          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{booking.customer_name}</h3>
              <p className="text-amber-400 text-sm">{booking.services?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">${booking.deposit_amount} deposit</p>
              <p className="text-gray-500 text-xs mt-1">
                {new Date(booking.submitted_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="text-sm text-gray-400 space-y-1 mb-4">
            <p>📧 {booking.customer_email}</p>
            {booking.customer_phone && <p>📞 {booking.customer_phone}</p>}
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="bg-gray-900 rounded-lg px-4 py-3 text-sm text-gray-300 mb-4">
              {booking.notes}
            </div>
          )}

          {/* Photos */}
         {booking.booking_photos?.length > 0 && (
            <div className="flex gap-3 mb-6">
                {booking.booking_photos.map(function(photo, i) {
                return (
                    <a key={i} href={photo.storage_url} target="_blank" rel="noreferrer">
                    <img
                        src={photo.storage_url}
                        alt={"Photo " + (i + 1)}
                        className="w-24 h-24 object-cover rounded-lg border border-gray-700 hover:border-amber-500 transition-colors"
                    />
                    </a>
                )
                })}
            </div>
            )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => handleApprove(booking)}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => handleDecline(booking)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Decline
            </button>
          </div>

        </div>
      ))}
    </div>
  )
}