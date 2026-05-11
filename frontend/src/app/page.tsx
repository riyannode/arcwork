'use client';

import Link from 'next/link';

const flow = [
  {
    step: '01',
    title: 'Create project',
    body: 'Freelancer defines the client, scope, and milestone amounts in USDC.',
  },
  {
    step: '02',
    title: 'Fund escrow',
    body: 'Client approves USDC and funds the full project into ArcWork escrow.',
  },
  {
    step: '03',
    title: 'Submit work',
    body: 'Freelancer submits milestone delivery links once work is ready.',
  },
  {
    step: '04',
    title: 'Release payout',
    body: 'Client approves each milestone and USDC settles to the freelancer on Arc.',
  },
];

const metrics = [
  { label: 'Settlement layer', value: 'Arc' },
  { label: 'Payment asset', value: 'USDC' },
  { label: 'Escrow model', value: 'Milestone' },
  { label: 'Proof layer', value: 'Completed work' },
];

export default function Home() {
  return (
    <div className="relative">
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
              <span className="pulse-dot" />
              <span className="text-xs font-light uppercase tracking-[0.24em] text-white/50">
                Arc-native USDC escrow
              </span>
            </div>

            <h1 className="max-w-4xl text-[42px] font-light leading-[1.05] text-white md:text-[72px]">
              Milestone payments for real freelance work.
            </h1>

            <p className="mt-7 max-w-2xl text-base font-light leading-8 text-white/50">
              ArcWork lets freelancers and agencies create USDC project invoices, lock client funds in escrow,
              and release payouts milestone-by-milestone with transparent settlement on Arc.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/invoice" className="btn-primary">
                Create Project
              </Link>
              <Link href="/dashboard" className="btn-ghost">
                View Dashboard
              </Link>
            </div>
          </div>

          <div className="glass-card p-6 md:p-8">
            <div className="mb-7 flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-light uppercase tracking-[0.24em] text-cyan-300/70">
                  Live escrow path
                </p>
                <h2 className="mt-3 text-2xl font-light">Design sprint invoice</h2>
              </div>
              <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
                Fundable
              </div>
            </div>

            <div className="space-y-4">
              {flow.map((item) => (
                <div key={item.step} className="grid grid-cols-[44px_1fr] gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-300/10 text-xs text-cyan-200">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">{item.title}</h3>
                    <p className="mt-1 text-sm font-light leading-6 text-white/45">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-6 py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 md:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="py-4">
              <p className="text-xs font-light uppercase tracking-[0.2em] text-white/35">{metric.label}</p>
              <p className="mt-2 text-xl font-light text-white">{metric.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <p className="text-xs font-light uppercase tracking-[0.24em] text-cyan-300/70">Why ArcWork</p>
            <h2 className="mt-4 text-3xl font-light leading-tight">
              Escrow is the product. Badges and retainers come after real payments.
            </h2>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-base font-light">Freelancer protection</h3>
            <p className="mt-3 text-sm font-light leading-7 text-white/45">
              Work starts after the client has locked USDC. The freelancer sees funded status before delivery.
            </p>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-base font-light">Client control</h3>
            <p className="mt-3 text-sm font-light leading-7 text-white/45">
              Funds release only after milestone approval, keeping payment transparent without platform custody.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
