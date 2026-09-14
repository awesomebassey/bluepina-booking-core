"use client";
import { FormEvent, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export function HostOnboarding() {
  const [result, setResult] = useState( "");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      propertyName: f.get("propertyName"),
      slug: String(f.get("slug")),
      timezone: f.get("timezone"),
      unitName: f.get("unitName"),
      capacity: Number(f.get("capacity")),
      nightlyRateCents: Math.round(Number(f.get("rate")) * 100),
      currency: f.get("currency"),
    };
    const res = await fetch(`${API}/v1/host/onboard`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    setResult(
      res.ok
        ? `Property created. Unit ID: ${body.units?.[0]?.id}`
        : (body.message ?? "Request failed"),
    );
  }
  return (
    <>
      <form className="form" onSubmit={submit}>
        <div className="row">
          <label>
            Property name
            <input name="propertyName" defaultValue="Casa Nube" required />
          </label>
          <label>
            Slug
            <input name="slug" defaultValue="casa-nube" required />
          </label>
        </div>
        <div className="row">
          <label>
            Timezone
            <input
              name="timezone"
              defaultValue="America/Mexico_City"
              required
            />
          </label>
          <label>
            Unit
            <input name="unitName" defaultValue="Ocean Suite" required />
          </label>
        </div>
        <div className="row">
          <label>
            Capacity
            <input
              name="capacity"
              type="number"
              min="1"
              defaultValue="2"
              required
            />
          </label>
          <label>
            Nightly rate
            <input
              name="rate"
              type="number"
              min="1"
              defaultValue="210"
              required
            />
          </label>
        </div>
        <label>
          Currency
          <input name="currency" defaultValue="USD" required />
        </label>
        <button className="button primary">Onboard property</button>
      </form>
      {result && <div className="terminal">{result}</div>}
    </>
  );
}
