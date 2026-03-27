import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })

Deno.serve(async (req) => {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    )
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err}`, { status: 400 })
  }

  // Service-role client bypasses RLS for writing to subscriptions table
  // SUPABASE_SERVICE_ROLE_KEY is auto-provisioned by Supabase — do NOT set it manually
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // ── Job posting payment ──────────────────────────────────
      if (session.metadata?.type === 'job_posting') {
        const pendingId = session.metadata.pending_id
        const tier = session.metadata.tier as 'standard' | 'featured'
        if (!pendingId) throw new Error('Missing pending_id in metadata')

        // Fetch job data from pending table
        const { data: pending, error: fetchErr } = await supabaseAdmin
          .from('pending_job_postings').select('data, tier').eq('id', pendingId).single()
        if (fetchErr || !pending) throw new Error(`Pending job not found: ${fetchErr?.message}`)

        const job = pending.data as Record<string, unknown>
        const isFeatured = tier === 'featured'
        const tags: string[] = ['new']
        if (isFeatured) tags.push('featured')
        if (job.remote) tags.push('remote')

        // Insert active job
        await supabaseAdmin.from('jobs').insert({
          id: `paid-${pendingId}`,
          studio_id: null,
          title: job.title,
          company: job.company,
          company_logo: (job.company as string).slice(0, 2).toUpperCase(),
          company_color: '#FF5C00',
          location: job.location,
          remote: job.remote ?? false,
          discipline: job.discipline,
          experience_level: job.experienceLevel,
          salary_band: job.salaryBand ?? null,
          salary: job.salary ?? null,
          tags,
          posted_at: new Date().toISOString(),
          description: job.description,
          apply_url: job.applyUrl,
          source: 'paid',
          status: 'active',
        })

        // Clean up pending row
        await supabaseAdmin.from('pending_job_postings').delete().eq('id', pendingId)

        return new Response(JSON.stringify({ received: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // ── Premium subscription ─────────────────────────────────
      const userId = session.client_reference_id
      if (!userId) throw new Error('Missing client_reference_id')

      // Retrieve the subscription to get current_period_end
      // (not available on the session object directly)
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

      await supabaseAdmin.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        status: 'active',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      }, { onConflict: 'user_id' })

    } else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription
      // UPDATE only — never insert. Race condition (updated before completed) is
      // handled by checkout.session.completed arriving shortly after.
      await supabaseAdmin.from('subscriptions')
        .update({
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)

    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      await supabaseAdmin.from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', sub.id)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
