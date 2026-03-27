import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

const PRICES: Record<string, string> = {
  standard: Deno.env.get('STRIPE_JOB_STANDARD_PRICE_ID') ?? '',
  featured:  Deno.env.get('STRIPE_JOB_FEATURED_PRICE_ID') ?? '',
}

const REQUIRED_FIELDS = ['title', 'company', 'location', 'discipline', 'experienceLevel', 'description', 'applyUrl', 'contactEmail']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { jobData, tier } = body as { jobData: Record<string, unknown>; tier: 'standard' | 'featured' }

    // Validate tier
    if (!tier || !PRICES[tier]) {
      return new Response(JSON.stringify({ error: 'Invalid tier. Must be standard or featured.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate required fields
    const missing = REQUIRED_FIELDS.filter(f => !jobData[f])
    if (missing.length > 0) {
      return new Response(JSON.stringify({ error: `Missing required fields: ${missing.join(', ')}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const priceId = PRICES[tier]
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Job posting prices not configured.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Save job data to pending_job_postings
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: pending, error: dbError } = await supabase
      .from('pending_job_postings')
      .insert({ data: jobData, tier })
      .select('id')
      .single()

    if (dbError || !pending) {
      throw new Error(`DB insert failed: ${dbError?.message}`)
    }

    // Create Stripe Checkout (one-time payment, not subscription)
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://builtloadout.com'
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: jobData.contactEmail as string,
      metadata: {
        type: 'job_posting',
        pending_id: pending.id,
        tier,
      },
      success_url: `${siteUrl}/post-a-job/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/post-a-job`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
