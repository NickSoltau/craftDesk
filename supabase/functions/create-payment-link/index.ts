import Stripe from "https://esm.sh/stripe@14.21.0"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2022-11-15",
})

async function sendApprovalEmail(
  customerEmail: string,
  customerName: string,
  serviceName: string,
  depositAmount: number,
  paymentLink: string,
  statusUrl: string
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
    },
    body: JSON.stringify({
      from: "CraftDesk <onboarding@resend.dev>",
      to: customerEmail,
      subject: `Your repair request has been approved — ${serviceName}`,
      html: "<div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;'>"
  + "<h1 style='color: #111;'>Good news, " + customerName + "!</h1>"
  + "<p style='color: #444; font-size: 16px;'>Your request for <strong>" + serviceName + "</strong> has been reviewed and approved.</p>"
  + "<p style='color: #444; font-size: 16px;'>To secure your slot, please pay your deposit of <strong>$" + depositAmount + "</strong> using the link below.</p>"
  + "<a href='" + paymentLink + "' style='display: inline-block; background: #d97706; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 16px 0;'>Pay $" + depositAmount + " Deposit →</a>"
  + "<p style='color: #666; font-size: 14px; margin-top: 24px;'>You can track your job status anytime here:</p>"
  + "<a href='" + statusUrl + "' style='color: #d97706;'>" + statusUrl + "</a>"
  + "<hr style='border: none; border-top: 1px solid #eee; margin: 32px 0;' />"
  + "<p style='color: #999; font-size: 12px;'>This email was sent by CraftDesk on behalf of your repair shop.</p>"
  + "</div>",
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error("Resend error:", error)
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  try {
    const { bookingId, amount, customerEmail, customerName, serviceName, shopName } = await req.json()

    console.log("Received:", { bookingId, amount, customerEmail, customerName, serviceName, shopName })

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${serviceName} Deposit — ${shopName}`,
              description: `Booking deposit to confirm your repair request.`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      after_completion: {
        type: "redirect",
        redirect: {
          url: `${Deno.env.get("SITE_URL")}/status/${bookingId}`,
        },
      },
      metadata: {
        booking_id: bookingId,
      },
    })

    const statusUrl = `${Deno.env.get("SITE_URL")}/status/${bookingId}`

    await sendApprovalEmail(
      customerEmail,
      customerName,
      serviceName,
      amount,
      paymentLink.url,
      statusUrl
    )

    return new Response(JSON.stringify({ url: paymentLink.url }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  }
})