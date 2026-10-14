import React from 'react';
import './index.css';
import {
  ShieldCheck,
  Zap,
  Wallet,
  Code2,
  ArrowRight,
  Check,
  Building2,
  Users,
  Server,
} from 'lucide-react';

const PROVIDERS = [
  { name: 'bKash', color: 'var(--bkash)' },
  { name: 'Nagad', color: 'var(--nagad)' },
  { name: 'Rocket', color: 'var(--rocket)' },
  { name: 'Upay', color: 'var(--upay)' },
  { name: 'Cellfin', color: 'var(--cellfin)' },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Atomic SMS Verification',
    body: 'A dedicated forwarder handset relays provider confirmation SMS over an IP-whitelisted, HMAC-SHA256 signed endpoint. Unparseable messages are quarantined, never dropped.',
  },
  {
    icon: Wallet,
    title: 'Zero Provider Integration',
    body: 'Customers transfer to a managed wallet pool quoting an 8-character typo-checked reference. No bKash or Nagad merchant API keys, no PSP agreement, no per-transaction API dependency.',
  },
  {
    icon: Zap,
    title: 'Sub-15s Settlement Signal',
    body: 'The matching engine claims payments atomically in PostgreSQL and fires your webhook within seconds — with idempotency keys and anti-brute-force lockout built in.',
  },
  {
    icon: Code2,
    title: 'Typed Contracts',
    body: 'OpenAPI 3.1 specs and Zod schemas generated from one source. Embed the checkout popup with a single script tag, or call /v1 directly from your backend.',
  },
];

const STEPS = [
  { n: '01', t: 'Create a payment', d: 'POST /v1/payments with your merchant API key. You get back a reference and a hosted pay URL.' },
  { n: '02', t: 'Customer sends money', d: 'They pick bKash, Nagad, Rocket, Upay or Cellfin, and quote the exact 8-character reference.' },
  { n: '03', t: 'SMS confirms & matches', d: 'The forwarder handset relays the confirmation. The engine claims it atomically and settles.' },
  { n: '04', t: 'You get a webhook', d: 'HMAC-SHA256 signed, with replay defense. Ledger entries post to a double-entry journal.' },
];

const PORTALS = [
  { icon: Users, label: 'Merchant', host: 'merchant.krostio.com', desc: 'GMV, payments, plans, settlements, webhooks', href: 'https://merchant.krostio.com' },
  { icon: Building2, label: 'Admin', host: 'admin.krostio.com', desc: 'Fleet, wallet pool, review queue, payouts, audit', href: 'https://admin.krostio.com' },
  { icon: Server, label: 'API', host: 'api.krostio.com', desc: '/v1 REST, SMS ingest, interactive sandbox', href: 'https://api.krostio.com' },
];

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ink)] text-[var(--bg)] font-bold text-sm">KR</div>
            <span className="text-[17px] font-bold tracking-tight">Krostio</span>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-[var(--ink-2)] md:flex">
            <a href="#how" className="transition-colors hover:text-[var(--ink)]">How it works</a>
            <a href="#features" className="transition-colors hover:text-[var(--ink)]">Platform</a>
            <a href="#portals" className="transition-colors hover:text-[var(--ink)]">Portals</a>
            <a href="#developers" className="transition-colors hover:text-[var(--ink)]">Developers</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="https://merchant.krostio.com" className="hidden text-sm font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--ink)] sm:block">Sign in</a>
            <a
              href="https://merchant.krostio.com"
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Get started
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{ background: 'radial-gradient(60rem 30rem at 50% -10rem, var(--accent-soft), transparent)' }}
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 text-center sm:pt-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--ink-2)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            </span>
            Now onboarding merchants in Bangladesh
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
            Accept every Bangladeshi wallet.
            <br />
            <span className="text-[var(--accent)]">Ship in a day.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--ink-2)]">
            Krostio lets online merchants collect bKash, Nagad, Rocket, Upay and Cellfin payments with
            zero provider API integration — verified atomically by SMS, settled through a double-entry ledger.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://merchant.krostio.com"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-[var(--bg)] transition-opacity hover:opacity-90"
            >
              Start accepting payments <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#developers"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold transition-colors hover:bg-[var(--surface-2)]"
            >
              Read the API docs
            </a>
          </div>

          {/* Provider strip */}
          <div className="mt-16">
            <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-[var(--ink-3)]">
              Five wallets, one integration
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {PROVIDERS.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="text-sm font-semibold">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-b border-[var(--border)] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How a payment flows</h2>
            <p className="mt-4 text-[var(--ink-2)]">
              No provider APIs to sign up for. No escrow. Krostio is a verification and settlement layer.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="font-mono text-xs font-medium text-[var(--accent)]">{s.n}</div>
                <h3 className="mt-3 text-base font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-[var(--border)] bg-[var(--surface-2)]/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for money that must not lie</h2>
            <p className="mt-4 text-[var(--ink-2)]">
              Integer-paisa arithmetic only. Explicit, non-reversible state machines. Tamper-evident audit chains.
            </p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-2)]">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals */}
      <section id="portals" className="border-b border-[var(--border)] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Three portals, strictly separated</h2>
            <p className="mt-4 text-[var(--ink-2)]">
              Each application ships as its own bundle on its own subdomain. Admin code can never reach a
              merchant's or customer's browser.
            </p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {PORTALS.map((p) => (
              <a
                key={p.label}
                href={p.href}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--accent)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--ink-3)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{p.label}</h3>
                <div className="mt-1 font-mono text-xs text-[var(--accent)]">{p.host}</div>
                <p className="mt-2.5 text-sm leading-relaxed text-[var(--ink-2)]">{p.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Developers */}
      <section id="developers" className="border-b border-[var(--border)] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Two lines to a pay button</h2>
              <p className="mt-4 leading-relaxed text-[var(--ink-2)]">
                Drop the popup SDK on your checkout page, or call <span className="font-mono text-sm">/v1/payments</span> directly
                from your backend and redirect to the hosted page. Webhooks are HMAC-SHA256 signed with a
                timestamp and version, and idempotency keys make retries safe.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  'Idempotency-Key on every mutating endpoint',
                  'HMAC-SHA256 webhook signatures (t=,v1=)',
                  'OpenAPI 3.1 spec + typed SDKs',
                  'Interactive API sandbox at api.krostio.com',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--ink-2)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="https://api.krostio.com"
                className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-2)]"
              >
                Open the API sandbox <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0B0B0E]">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F97066]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FDB022]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#32D583]" />
                <span className="ml-2 font-mono text-[11px] text-white/40">checkout.html</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-white/85">
                <code>{`<script src="https://pay.krostio.com/krostio.js">
</script>
<script>
  Krostio.open({
    paymentId: 'pay_01ha9x201',
    onSuccess: (p) => {
      // p.status === 'paid'
      fulfillOrder(p.orderId);
    },
  });
</script>`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-8 py-14 text-center">
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{ background: 'radial-gradient(40rem 20rem at 50% 0%, var(--accent-soft), transparent)' }}
            />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to take your first payment?</h2>
              <p className="mx-auto mt-4 max-w-xl text-[var(--ink-2)]">
                Create a merchant account, generate a test API key, and run a sandbox checkout in under five minutes.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="https://merchant.krostio.com"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Create merchant account <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="https://api.krostio.com"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-semibold transition-colors hover:bg-[var(--surface-2)]"
                >
                  Try the sandbox
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--ink)] text-[var(--bg)] font-bold text-xs">KR</div>
            <span className="text-sm font-semibold">Krostio</span>
          </div>
          <p className="text-xs text-[var(--ink-3)]">
            © 2026 Krostio. Bangladeshi MFS payment verification &amp; settlement.
          </p>
          <div className="flex gap-5 text-xs text-[var(--ink-3)]">
            <a href="https://merchant.krostio.com" className="transition-colors hover:text-[var(--ink-2)]">Merchant</a>
            <a href="https://admin.krostio.com" className="transition-colors hover:text-[var(--ink-2)]">Admin</a>
            <a href="https://api.krostio.com" className="transition-colors hover:text-[var(--ink-2)]">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
