"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL;

type AvailableUnit = {
  id: string;
  name: string;
  capacity: number;
  nightlyRateCents: number;
  currency: string;
  property: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
  };
};

export function BookingDemo() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [unitId, setUnitId] = useState("");

  const [units, setUnits] = useState<AvailableUnit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!checkIn || !checkOut) {
      setUnits([]);
      setUnitId("");
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setUnits([]);
      setUnitId("");

      toast.error("Invalid dates", {
        description: "Check-out must be after check-in.",
      });

      return;
    }

    const controller = new AbortController();

    async function loadAvailableUnits() {
      setLoadingUnits(true);
      setUnitId("");

      try {
        const params = new URLSearchParams({
          checkIn,
          checkOut,
        });

        const response = await fetch(
          `${API}/v1/available-units?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            Array.isArray(data.message)
              ? data.message.join(", ")
              : (data.message ?? "Could not load available units"),
          );
        }

        setUnits(data);

        if (data.length === 0) {
          toast.info("No availability", {
            description: "There are no available units for the selected dates.",
          });
        }

        if (data.length === 1) {
          setUnitId(data[0].id);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setUnits([]);

        toast.error("Could not check availability", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
        });
      } finally {
        setLoadingUnits(false);
      }
    }

    loadAvailableUnits();

    return () => controller.abort();
  }, [checkIn, checkOut]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!unitId) {
      toast.error("Select a unit", {
        description: "Choose an available unit before continuing.",
      });

      return;
    }

    setBusy(true);

  const form = e.currentTarget;
  const data = new FormData(form);

    try {
      const holdRes = await fetch(`${API}/v1/holds`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          unitId,
          checkIn,
          checkOut,
          idempotencyKey: crypto.randomUUID(),
        }),
      });

      const hold = await holdRes.json();

      if (!holdRes.ok) {
        throw new Error(
          Array.isArray(hold.message)
            ? hold.message.join(", ")
            : (hold.message ?? "Could not create reservation hold"),
        );
      }

      const bookingRes = await fetch(`${API}/v1/bookings`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          holdId: hold.id,
          guestName: data.get("guestName"),
          guestEmail: data.get("guestEmail"),
        }),
      });

      const booking = await bookingRes.json();

      if (!bookingRes.ok) {
        throw new Error(
          Array.isArray(booking.message)
            ? booking.message.join(", ")
            : (booking.message ?? "Could not create booking"),
        );
      }

      toast.success("Booking created", {
        description: `Amount: ${(booking.totalAmountCents / 100).toFixed(
          2,
        )} ${booking.currency} | Status: ${booking.status.replace(/_/, " ")}`,
      });

      form.reset();
      setCheckIn("");
      setCheckOut("");
      setUnitId("");
      setUnits([]);
    } catch (error) {
      toast.error("Booking failed", {
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
          Check-in
          <input
            name="checkIn"
            type="date"
            required
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </label>

        <label>
          Check-out
          <input
            name="checkOut"
            type="date"
            required
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </label>
      </div>

      <label>
        Available unit
        <select
          name="unitId"
          required
          value={unitId}
          disabled={!checkIn || !checkOut || loadingUnits}
          onChange={(e) => setUnitId(e.target.value)}
        >
          <option value="">
            {loadingUnits
              ? "Checking availability..."
              : "Select an available unit"}
          </option>

          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.property.name} — {unit.name} —{" "}
              {(unit.nightlyRateCents / 100).toFixed(2)} {unit.currency}/night
            </option>
          ))}
        </select>
      </label>

      <div className="row">
        <label>
          Guest name
          <input name="guestName" required />
        </label>

        <label>
          Email
          <input name="guestEmail" type="email" required />
        </label>
      </div>

      <button className="button primary" disabled={busy || !unitId}>
        {busy ? "Creating booking…" : "Create hold + booking"}
      </button>
    </form>
  );
}
