import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg-tertiary via-bg-primary to-bg-primary" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(151,118,78,0.08),transparent_60%)]" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <p className="text-gold uppercase text-sm tracking-[0.3em] font-medium mb-6">
            Gold River Homes
          </p>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Enter Your Costs",
                desc: "Input your home price, land cost, and adjust site servicing estimates for well, septic, electrical, and more.",
              },
              {
                step: "02",
                title: "See the Full Picture",
                desc: "View an itemized breakdown of every cost category with a visual chart showing where your money goes.",
              },
              {
                step: "03",
                title: "Calculate Your Mortgage",
                desc: "Set your down payment, interest rate, and amortization to see monthly and bi-weekly payment estimates.",
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
            {[
              { icon: "\u{1F3E0}", label: "Home Price" },
              { icon: "\u{1F30D}", label: "Land Purchase" },
              { icon: "\u{1F527}", label: "Site Prep" },
              { icon: "\u{1F4A7}", label: "Well / Water" },
              { icon: "\u{1F50C}", label: "Electrical" },
              { icon: "\u{1F6B0}", label: "Septic / Sewer" },
              { icon: "\u{1F69A}", label: "Delivery" },
              { icon: "\u{1F4CB}", label: "Permits" },
              { icon: "\u{1F6E1}", label: "Contingency" },
              { icon: "\u{1F4CA}", label: "Mortgage" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 py-4"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-text-secondary text-xs uppercase tracking-widest font-medium">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-text-white text-3xl sm:text-4xl mb-4">
            Ready to Plan Your Home?
          </h2>
          <p className="text-text-muted text-lg mb-8">
            Get a complete cost estimate in minutes, or reach out to our team
            for personalized guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/calculator"
              className="bg-gold hover:bg-gold-bright text-white uppercase text-sm font-medium tracking-widest px-10 py-4 transition-colors duration-200"
            >
              Start Calculating
            </Link>
            <a
              href="tel:+19022733033"
              className="border border-gold/40 text-gold hover:bg-gold/10 uppercase text-sm font-medium tracking-widest px-10 py-4 transition-colors duration-200"
            >
              Call (902) 273-3033
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
