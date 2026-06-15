import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"

export default function BookingPage() {
  const { slug } = useParams()
  const [shop, setShop] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    service_id: "",
    notes: "",
  })

  const [photos, setPhotos] = useState([])
  const selectedService = services.find(s => s.id === form.service_id)

  useEffect(() => {
    async function fetchShopData() {
      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .select("*")
        .eq("slug", slug)
        .single()

        console.log("Shop data:", shopData)
        console.log("Shop error:", shopError)

      if (shopError || !shopData) {
        setError("Shop not found.")
        setLoading(false)
        return
      }

      setShop(shopData)

      const { data: serviceData, error: serviceError } = await supabase
        .from("services")
        .select("*")
        .eq("shop_id", shopData.id)
        .eq("is_active", true)

      if (serviceError) {
        setError("Could not load services.")
      } else {
        setServices(serviceData)
      }

      setLoading(false)
    }

    fetchShopData()
  }, [])

  

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files).slice(0, 3)
    setPhotos(files)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!form.service_id) {
      setError("Please select a service.")
      setSubmitting(false)
      return
    }

    // Insert booking row
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        shop_id: shop.id,
        service_id: form.service_id,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        notes: form.notes,
        deposit_amount: selectedService.deposit_amount,
        status: "pending",
      })
      .select()
      .single()

    if (bookingError) {
      setError("Something went wrong submitting your booking. Please try again.")
      setSubmitting(false)
      return
    }

    // Upload photos if any
    if (photos.length > 0) {
      for (const photo of photos) {
        const fileName = `${booking.id}/${Date.now()}-${photo.name}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("booking-photos")
          .upload(fileName, photo)

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from("booking-photos")
            .getPublicUrl(fileName)

          await supabase.from("booking_photos").insert({
            booking_id: booking.id,
            storage_url: urlData.publicUrl,
          })
        }
      }
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-5xl mb-4">🧤</div>
          <h2 className="text-2xl font-bold mb-2">Request Received!</h2>
          <p className="text-gray-400">
            Thanks {form.customer_name}! We'll review your request and send you a deposit link once approved. Keep an eye on your email.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{shop?.shop_name}</h1>
          <p className="text-gray-400 mt-1">Request a repair or restoration service</p>
        </div>

        {error && (
          <div className="bg-red-900 text-red-200 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Service
            </label>
            <select
              name="service_id"
              value={form.service_id}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Choose a service --</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>

            {/* Deposit + turnaround preview */}
            {selectedService && (
              <div className="mt-3 bg-gray-800 rounded-lg px-4 py-3 text-sm">
                <p className="text-gray-300">{selectedService.description}</p>
                <div className="flex justify-between mt-2">
                  <span className="text-amber-400 font-semibold">
                    Deposit: ${selectedService.deposit_amount}
                  </span>
                  <span className="text-gray-400">
                    Est. {selectedService.estimated_days} days
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
              required
              placeholder="John Smith"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="customer_email"
              value={form.customer_email}
              onChange={handleChange}
              required
              placeholder="john@email.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="tel"
              name="customer_phone"
              value={form.customer_phone}
              onChange={handleChange}
              placeholder="555-555-5555"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Describe the damage or work needed
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              placeholder="e.g. Lacing is broken on the thumb and index finger, leather is dry and cracked on the palm..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload Photos <span className="text-gray-500">(up to 3)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="w-full text-gray-400 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer"
            />
            {photos.length > 0 && (
              <p className="text-gray-500 text-xs mt-2">
                {photos.length} photo{photos.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {submitting ? "Submitting..." : "Request Booking"}
          </button>

        </form>
      </div>
    </div>
  )
}