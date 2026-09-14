const items = [
  [
    "Database as concurrency authority",
    "Availability pre-checks are advisory. A unique (unitId, date) database constraint decides whether a hold wins.",
  ],
  [
    "15-minute reservation holds",
    "A short-lived hold separates inventory locking from payment completion and can be safely expired by a worker.",
  ],
  [
    "Idempotent edges",
    "Client hold retries and payment-provider redeliveries cannot duplicate state transitions.",
  ],
  [
    "Calendar sync is a boundary",
    "iCal/PMS data maps into reservation blocks, but conflicting external data never overwrites a local booking silently.",
  ],
  [
    "Audit before microservices",
    "At the first 100 properties, an explainable state trail is more valuable than distributing a system that has not earned the complexity.",
  ],
];
export default function ArchitecturePage() {
  return (
    <div className="shell narrow">
      <h1>Five decisions behind the slice.</h1>
      <div className="stack">
        {items.map(([h, p], i) => (
          <article className="decision" key={h}>
            <b>{String(i + 1).padStart(2, "0")}</b>
            <div>
              <h2>{h}</h2>
              <p>{p}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
