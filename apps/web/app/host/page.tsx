import { HostOnboarding } from "../../components/HostOnboarding";
export default function HostPage() {
  return (
    <div className="shell narrow">
      <h1>List a property for booking.</h1>
      <p className="lead small">
        One focused onboarding slice: property, unit, capacity, nightly rate and
        timezone, the minimum needed to enter the availability system.
      </p>
      <HostOnboarding />
    </div>
  );
}
