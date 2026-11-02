import Magnetic from './Magnetic';

export default function Footer() {
  return (
    <footer id="contact" className="relative overflow-hidden border-t border-border pt-24 pb-10 md:pt-36">
      <div aria-hidden="true" className="ember-field absolute inset-0 -z-10 opacity-80" />
      <div className="wrap">
        <p className="label text-accent" data-fade>
          Contact
        </p>
        <h2 className="display mt-6 max-w-[14ch] text-[clamp(2.75rem,9vw,8.5rem)]" data-split="scroll">
          Have something that needs heat?
        </h2>
        <div className="mt-12 flex flex-wrap items-center gap-4" data-fade>
          <Magnetic>
            <a className="btn" href="mailto:hello@example.com" data-cursor="Write">
              hello@example.com <span aria-hidden="true">↗</span>
            </a>
          </Magnetic>
          <a className="btn btn--ghost" href="tel:5550100">
            555-0100
          </a>
        </div>
        <dl className="mt-20 grid gap-8 text-sm sm:grid-cols-3">
          <div data-pop>
            <dt className="label text-muted">Studio</dt>
            <dd className="mt-2">14 Kiln Row, Port Calder</dd>
          </div>
          <div data-pop>
            <dt className="label text-muted">Hours</dt>
            <dd className="mt-2">Mon–Thu, 9:00–17:30</dd>
          </div>
          <div data-pop>
            <dt className="label text-muted">New work</dt>
            <dd className="mt-2">Booking projects from spring 2027</dd>
          </div>
        </dl>
        <p className="mt-20 border-t border-border pt-6 text-sm text-muted">
          Atlas &amp; Ember is a fictional studio made for a design demo. Every project, person, address, phone number and figure on this site is sample content.
        </p>
      </div>
    </footer>
  );
}
