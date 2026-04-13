import Link from "next/link";

export default function Footer() {
  return (
    <footer id="contact" className="bg-bg-tertiary border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-display text-text-white text-xl mb-4">
              Gold River Homes
            </h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Established in 2006, serving Nova Scotia with full-service modular
              home solutions from planning and permitting to delivery and set-up.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-gold uppercase text-xs font-medium tracking-widest mb-4">
              Contact Us
            </h4>
            <div className="space-y-2 text-text-secondary text-sm">
              <p>219 NS-12, Chester Basin, NS B0J 1K0</p>
              <p>
                <a href="tel:+19022733033" className="hover:text-gold transition-colors">
                  +1 (902) 273-3033
                </a>
              </p>
              <p>
                <a href="mailto:info@goldriverhomes.ca" className="hover:text-gold transition-colors">
                  info@goldriverhomes.ca
                </a>
              </p>
              <p className="text-text-muted">Mon - Fri: 8:00 AM - 4:00 PM</p>
            </div>
          </div>

          {/* Service Area */}
          <div>
            <h4 className="text-gold uppercase text-xs font-medium tracking-widest mb-4">
              Service Area
            </h4>
            <div className="grid grid-cols-2 gap-1 text-text-secondary text-sm">
              <span>Lunenburg</span>
              <span>Queens</span>
              <span>Shelburne</span>
              <span>Annapolis</span>
              <span>Digby</span>
              <span>Yarmouth</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-xs">
            &copy; {new Date().getFullYear()} Gold River Homes. A{" "}
            <a
              href="https://www.supremehomes.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:text-gold-bright transition-colors"
            >
              Supreme Homes
            </a>{" "}
            retailer.
          </p>
          <div className="flex gap-6">
            <Link href="/" className="text-text-muted hover:text-gold text-xs uppercase tracking-widest transition-colors">
              Home
            </Link>
            <Link href="/calculator" className="text-text-muted hover:text-gold text-xs uppercase tracking-widest transition-colors">
              Calculator
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
