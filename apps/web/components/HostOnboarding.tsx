"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL;

export function HostOnboarding() {
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const f = new FormData(form);

    const payload = {
      propertyName: f.get("propertyName"),
      slug: String(f.get("slug")),
      timezone: f.get("timezone"),
      unitName: f.get("unitName"),
      capacity: Number(f.get("capacity")),
      nightlyRateCents: Math.round(Number(f.get("rate")) * 100),
      currency: f.get("currency"),
    };

    setBusy(true);

    try {
      const res = await fetch(`${API}/v1/host/onboard`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(body.message)
            ? body.message.join(", ")
            : body.message ?? "Request failed",
        );
      }

      toast.success("Property onboarded", {
        description: "Property created successfully.",
      });

      form.reset();
    } catch (error) {
      toast.error("Onboarding failed", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="row">
        <label>
          Property name
          <input
            name="propertyName"
            placeholder="Casa Nube"
            required
          />
        </label>

        <label>
          Slug
          <input
            name="slug"
            placeholder="casa-nube"
            required
          />
        </label>
      </div>

      <div className="row">
        <label>
          Timezone
          <input
            name="timezone"
            placeholder="America/Mexico_City"
            required
          />
        </label>

        <label>
          Unit
          <input
            name="unitName"
            placeholder="Ocean Suite"
            required
          />
        </label>
      </div>

      <div className="row">
        <label>
          Capacity
          <input
            name="capacity"
            type="number"
            min="1"
            placeholder="2"
            required
          />
        </label>

        <label>
          Nightly rate
          <input
            name="rate"
            type="number"
            min="1"
            placeholder="210"
            required
          />
        </label>
      </div>

      <label>
        Currency
        <input
          name="currency"
          placeholder="USD"
          required
        />
      </label>

      <button
        className="button primary"
        type="submit"
        disabled={busy}
      >
        {busy ? "Onboarding…" : "Onboard property"}
      </button>
    </form>
  );
}