"use client";

import Link from "next/link";
import { useState } from "react";

// SVG Icons — gray rounded style
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
        {children}
      </svg>
    </div>
  );
}

const costItems = [
  {
    label: "Home Price",
    icon: (
      <>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </>
    ),
  },
  {
    label: "Land Purchase",
    icon: (
      <>
        <path d="M3 20h18" />
        <path d="M5 20V10l7-7 7 7v10" />
        <path d="M9 20v-5h6v5" />
      </>
    ),
  },
  {
    label: "Site Prep",
    icon: (
      <>
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3-3a1 1 0 000-1.4l-1.6-1.6a1 1 0 00-1.4 0l-3 3z" />
        <path d="M5 20l6-6m0 0l2-2m-2 2l-4-4" />
        <path d="M2 22l4-4" />
      </>
    ),
  },
  {
    label: "Well / Water",
    icon: (
      <>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10" />
        <path d="M12 6v6l4 2" />
        <circle cx="18" cy="6" r="3" />
      </>
    ),
  },
  {
    label: "Electrical",
    icon: (
      <>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </>
    ),
  },
  {
    label: "Septic / Sewer",
    icon: (
      <>
        <path d="M12 22V12" />
        <path d="M5 12H2a10 10 0 0020 0h-3" />
        <path d="M8 12V7a4 4 0 018 0v5" />
      </>
    ),
  },
  {
    label: "Delivery",
    icon: (
      <>
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 5v4h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </>
    ),
  },
  {
    label: "Permits",
    icon: (
      <>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="12" y2="17" />
      </>
    ),
  },
  {
    label: "Contingency",
    icon: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </>
    ),
  },
  {
    label: "Mortgage",
    icon: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </>
    ),
  },
];

export default function Home() {
  const [formStatus, setFormStatus] = useState<"idle" | "sent">("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormStatus("sent");
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg-tertiary via-bg-primary to-bg-primary" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(151,118,78,0.08),transparent_60%)]" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          {/* Logo mark */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gold/20 border border-gold/40 rounded flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                <path d="M9 21V12h6v9" />
              </svg>
            </div>
            <span className="font-display text-text-white text-xl tracking-wide">Gold River Homes</span>
          </div>

          <h1 className="font-display text-text-white text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
            Know Your True
            <br />
            <span className="text-gold">Home Cost</span>
          </h1>
          <p className="text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Our all-in-one calculator shows you the complete picture &mdash;
            home price, land, site preparation, well, septic, utilities, and
            your estimated mortgage payment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/calculator"
              className="bg-gold hover:bg-gold-bright text-white uppercase text-sm font-medium tracking-widest px-10 py-4 transition-colors duration-200"
            >
              Calculate Your Costs
            </Link>
            <a
              href="#how-it-works"
              className="border border-gold/40 text-gold hover:bg-gold/10 uppercase text-sm font-medium tracking-widest px-10 py-4 transition-colors duration-200"
            >
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-gold uppercase text-xs tracking-[0.3em] font-medium mb-3">
              Simple &amp; Transparent
            </p>
            <h2 className="font-display text-text-white text-3xl sm:text-4xl">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Choose Your Home",
                desc: "Browse our model categories — mini, modular, traditional, or multi-story — and select the home that fits your lifestyle and budget.",
              },
              {
                step: "02",
                title: "Customize Your Finish",
                desc: "Pick your siding, roofing, flooring, countertops, and insulation level. Add a garage, front porch, or second storey if you want.",
              },
              {
                step: "03",
                title: "We Calculate Site Costs",
                desc: "We automatically estimate well, septic, electrical, foundation, and delivery based on typical costs in your area — no guesswork needed.",
              },
              {
                step: "04",
                title: "See Your Full Breakdown",
                desc: "View every cost itemized in a visual chart, then calculate your mortgage payment with your down payment, rate, and amortization.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-bg-secondary border border-border p-8 relative group hover:border-border-gold transition-colors duration-300"
              >
                <span className="font-accent text-gold/30 text-6xl absolute top-4 right-6 group-hover:text-gold/50 transition-colors">
                  {item.step}
                </span>
                <h3 className="font-display text-text-white text-xl mb-3 relative">
                  {item.title}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed relative">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/calculator"
              className="inline-block bg-gold hover:bg-gold-bright text-white uppercase text-sm font-medium tracking-widest px-10 py-4 transition-colors duration-200"
            >
              Try the Calculator
            </Link>
          </div>
        </div>
      </section>

      {/* What's Included Banner */}
      <section className="py-16 bg-bg-secondary border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-text-white text-2xl sm:text-3xl text-center mb-12">
            Every Cost, <span className="text-gold">Accounted For</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {costItems.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center py-4"
              >
                <Icon>{item.icon}</Icon>
                <span className="text-text-secondary text-xs uppercase tracking-widest font-medium text-center">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Form */}
            <div>
              <p className="text-gold uppercase text-xs tracking-[0.3em] font-medium mb-3">
                Get In Touch
              </p>
              <h2 className="font-display text-text-white text-3xl sm:text-4xl mb-4">
                Ready to Plan Your Home?
              </h2>
              <p className="text-text-muted text-base mb-8 leading-relaxed">
                Get a complete cost estimate in minutes, or reach out to our
                team for personalized guidance on your build.
              </p>

              {formStatus === "sent" ? (
                <div className="bg-gold/10 border border-gold/30 p-6 text-center">
                  <p className="font-display text-text-white text-xl mb-2">Message Sent!</p>
                  <p className="text-text-muted text-sm">We&apos;ll be in touch shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-secondary text-xs uppercase tracking-widest font-medium mb-1.5">
                        Your Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Jane Smith"
                        className="w-full bg-bg-elevated border border-border text-text-white placeholder:text-text-muted/50 text-sm px-4 py-3 focus:outline-none focus:border-gold/60 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-text-secondary text-xs uppercase tracking-widest font-medium mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="jane@example.com"
                        className="w-full bg-bg-elevated border border-border text-text-white placeholder:text-text-muted/50 text-sm px-4 py-3 focus:outline-none focus:border-gold/60 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-text-secondary text-xs uppercase tracking-widest font-medium mb-1.5">
                      City / Area You&apos;re Looking to Build
                    </label>
                    <input
                      type="text"
                      name="city"
                      placeholder="e.g. Chester Basin, Bridgewater, Liverpool..."
                      className="w-full bg-bg-elevated border border-border text-text-white placeholder:text-text-muted/50 text-sm px-4 py-3 focus:outline-none focus:border-gold/60 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-xs uppercase tracking-widest font-medium mb-1.5">
                      Message
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      placeholder="Tell us about your project — home type, lot details, timeline..."
                      className="w-full bg-bg-elevated border border-border text-text-white placeholder:text-text-muted/50 text-sm px-4 py-3 focus:outline-none focus:border-gold/60 transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gold hover:bg-gold-bright text-white uppercase text-sm font-medium tracking-widest px-10 py-4 transition-colors duration-200"
                  >
                    Send Message
                  </button>
                </form>
              )}

              {/* Contact details */}
              <div className="mt-8 pt-8 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-text-muted/60 text-xs uppercase tracking-widest mb-1">Phone</p>
                  <a href="tel:+19022733033" className="text-text-white text-sm hover:text-gold transition-colors">
                    (902) 273-3033
                  </a>
                </div>
                <div>
                  <p className="text-text-muted/60 text-xs uppercase tracking-widest mb-1">Email</p>
                  <a href="mailto:info@goldriverhomes.ca" className="text-text-white text-sm hover:text-gold transition-colors">
                    info@goldriverhomes.ca
                  </a>
                </div>
                <div>
                  <p className="text-text-muted/60 text-xs uppercase tracking-widest mb-1">Address</p>
                  <p className="text-text-white text-sm">219 NS-12, Chester Basin</p>
                </div>
              </div>
            </div>

            {/* Map + Service Areas */}
            <div className="space-y-6">
              <div className="aspect-[4/3] w-full overflow-hidden border border-border">
                <iframe
                  src="https://maps.google.com/maps?q=219+NS-12,Chester+Basin,Nova+Scotia+B0J+1K0&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Gold River Homes location"
                />
              </div>

              <div className="bg-bg-secondary border border-border p-6">
                <p className="text-gold uppercase text-xs tracking-[0.3em] font-medium mb-4">
                  Service Areas
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Lunenburg County",
                    "Queens County",
                    "Shelburne County",
                    "Annapolis County",
                    "Digby County",
                    "Yarmouth County",
                  ].map((area) => (
                    <div key={area} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold/60 shrink-0" />
                      <span className="text-text-secondary text-sm">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
