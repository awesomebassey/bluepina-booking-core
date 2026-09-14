import { BookingDemo } from "../../components/BookingDemo";
export default function BookPage() {
  return (
    <div className="shell narrow">
      <h1>Hold first. Pay second.</h1>
      <p className="lead small">
        The API claims every requested night transactionally before creating a
        payable booking.
      </p>
      <BookingDemo />
    </div>
  );
}
