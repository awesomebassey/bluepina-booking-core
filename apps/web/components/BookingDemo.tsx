"use client";
import { FormEvent, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export function BookingDemo() {
  const [result, setResult] = useState<string>("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const data = new FormData(e.currentTarget);
    try {
      const holdRes = await fetch(`${API}/v1/holds`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          unitId: data.get("unitId"),
          checkIn: data.get("checkIn"),
          checkOut: data.get("checkOut"),
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const hold = await holdRes.json();
      if (!holdRes.ok) throw new Error(hold.message ?? "Could not create hold");
      const bookingRes = await fetch(`${API}/v1/bookings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          holdId: hold.id,
          guestName: data.get("guestName"),
          guestEmail: data.get("guestEmail"),
        }),
      });
      const booking = await bookingRes.json();
      if (!bookingRes.ok)
        throw new Error(booking.message ?? "Could not create booking");
      setResult(
        `Booking ${booking.id} created in ${booking.status}. Amount: ${(booking.totalAmountCents / 100).toFixed(2)} ${booking.currency}. Hold expires ${new Date(hold.expiresAt).toLocaleTimeString()}.`,
      );
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form className="form" onSubmit={submit}>
        <label>
          Seeded unit ID
          <input name="unitId" required placeholder="cm..." />
        </label>
        <div className="row">
          <label>
            Check-in
            <input name="checkIn" type="date" required />
          </label>
          <label>
            Check-out
            <input name="checkOut" type="date" required />
          </label>
        </div>
        <div className="row">
          <label>
            Guest name
            <input name="guestName" required defaultValue="Alex Rivera" />
          </label>
          <label>
            Email
            <input
              name="guestEmail"
              type="email"
              required
              defaultValue="alex@example.com"
            />
          </label>
        </div>
        <button className="button primary" disabled={busy}>
          {busy ? "Creating hold…" : "Create hold + booking"}
        </button>
      </form>
      {result && <div className="terminal">{result}</div>}
    </>
  );
}
