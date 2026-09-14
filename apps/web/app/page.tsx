import Link from "next/link";
export default function Home() {
  return (
    <div className="shell">
      <section className="hero">
        <h1>Booking infrastructure that pays close attention to availability.</h1>
        <p className="lead">
          A deliberately small product slice for Bluepina: host onboarding,
          date-level inventory locking, reservation holds, idempotent payments,
          and external-calendar conflict handling.
        </p>
        <div className="actions">
          <Link className="button primary" href="/book">
            Try booking flow
          </Link>
          <Link className="button" href="/architecture">
            Read decisions
          </Link>
        </div>
      </section>
      <section className="grid3">
        <article className="card">
          <span>01</span>
          <h2>Prevent double booking</h2>
          <p>
            PostgreSQL owns the concurrency invariant through a unique unit/date
            reservation block.
          </p>
        </article>
        <article className="card">
          <span>02</span>
          <h2>Retry safely</h2>
          <p>
            Hold creation and payment webhook processing are idempotent across
            network retries and provider redelivery.
          </p>
        </article>
        <article className="card">
          <span>03</span>
          <h2>Make sync explainable</h2>
          <p>
            External calendar conflicts are reported instead of silently
            overwriting local booking state.
          </p>
        </article>
      </section>
      <section className="split">
        <div>
          <h2>Optimize for correctness, scale later.</h2>
        </div>
        <p>
          At this stage, supportability and inventory correctness matter more
          than microservices. The design keeps one transactional source of
          truth, clear audit events, and integration boundaries that can be
          replaced as PMS complexity grows.
        </p>
      </section>
    </div>
  );
}
