import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const formatTime = (time = "") => time.slice(0, 5);

const formatDate = (date = "") => {
  if (!date) return "";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getRemainingSeconds = (expiresAt) => {
  if (!expiresAt) return 0;

  // expiresAt is a LocalDateTime returned by the backend.
  const deadline = new Date(expiresAt).getTime();

  if (Number.isNaN(deadline)) return 0;

  return Math.max(0, Math.floor((deadline - Date.now()) / 1000));
};

const formatCountdown = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};

function BookingConfirmation() {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchBooking = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await axiosInstance.get("/api/bookings/me");

        const foundBooking = response.data.find(
          (item) => String(item.id) === String(bookingId)
        );

        if (!foundBooking) {
          throw new Error("Booking not found.");
        }

        if (!cancelled) {
          setBooking(foundBooking);
          setRemainingSeconds(
            getRemainingSeconds(foundBooking.expiresAt)
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load this booking."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchBooking();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  useEffect(() => {
    if (!booking?.expiresAt || booking.status !== "PENDING") {
      return;
    }

    const updateCountdown = () => {
      setRemainingSeconds(getRemainingSeconds(booking.expiresAt));
    };

    updateCountdown();

    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [booking?.expiresAt, booking?.status]);

  const handleConfirm = async () => {
    if (
      !booking ||
      booking.status !== "PENDING" ||
      remainingSeconds <= 0 ||
      confirming
    ) {
      return;
    }

    setConfirming(true);
    setError("");
    setSuccess("");

    try {
      const response = await axiosInstance.post(
        `/api/bookings/${booking.id}/confirm`
      );

      if (response.data?.id) {
        setBooking(response.data);
      } else {
        // The endpoint may return no response body.
        setBooking((current) => ({
          ...current,
          status: "CONFIRMED",
        }));
      }

      setSuccess("Your booking has been confirmed!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to confirm this booking. Please refresh and check its status."
      );

      // Refresh the booking status after a failed confirmation.
      try {
        const response = await axiosInstance.get("/api/bookings/me");

        const updatedBooking = response.data.find(
          (item) => String(item.id) === String(bookingId)
        );

        if (updatedBooking) {
          setBooking(updatedBooking);
          setRemainingSeconds(
            getRemainingSeconds(updatedBooking.expiresAt)
          );
        }
      } catch {
        // Keep the original confirmation error visible.
      }
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <main className="px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-xl border bg-white p-10 text-center">
          Loading booking...
        </div>
      </main>
    );
  }

  if (error && !booking) {
    return (
      <main className="px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="text-xl font-bold text-red-800">
            Unable to load booking
          </h1>

          <p className="mt-2 text-red-700">{error}</p>

          <Link
            to="/dashboard"
            className="mt-5 inline-block font-semibold text-indigo-600"
          >
            Go to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const isPending = booking?.status === "PENDING";
  const isExpired = isPending && remainingSeconds <= 0;
  const isConfirmed = booking?.status === "CONFIRMED";

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/dashboard"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to dashboard
        </Link>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div
            className={`px-6 py-8 text-white ${
              isConfirmed
                ? "bg-green-600"
                : isExpired
                ? "bg-slate-600"
                : "bg-indigo-700"
            }`}
          >
            <p className="text-sm font-medium text-white/80">
              Booking #{booking.id}
            </p>

            <h1 className="mt-2 text-2xl font-bold">
              {isConfirmed
                ? "Booking confirmed"
                : isExpired
                ? "Confirmation deadline passed"
                : "Confirm your booking"}
            </h1>

            <p className="mt-2 text-sm text-white/90">
              {isConfirmed
                ? "Your reservation is confirmed."
                : isExpired
                ? "The confirmation window has ended."
                : "Please confirm your reservation before the deadline."}
            </p>
          </div>

          <div className="space-y-5 p-6 md:p-8">
            <div>
              <p className="text-sm text-slate-500">Venue</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {booking.resourceName}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Date</p>
                <p className="mt-1 font-medium text-slate-900">
                  {formatDate(booking.date)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Time</p>
                <p className="mt-1 font-medium text-slate-900">
                  {formatTime(booking.startTime)} –{" "}
                  {formatTime(booking.endTime)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500">Booking status</p>
              <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {booking.status}
              </span>
            </div>

            {isPending && (
              <div
                className={`rounded-xl border p-5 ${
                  isExpired
                    ? "border-red-200 bg-red-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <p className="text-sm font-medium text-slate-700">
                  Time remaining
                </p>

                <p
                  className={`mt-1 text-4xl font-bold tabular-nums ${
                    isExpired ? "text-red-700" : "text-amber-700"
                  }`}
                >
                  {formatCountdown(remainingSeconds)}
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Deadline: {booking.expiresAt?.replace("T", " ")}
                </p>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
              >
                {success}
              </div>
            )}

            {isPending && !isExpired && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirming ? "Confirming..." : "Confirm Booking"}
              </button>
            )}

            {isExpired && (
              <p className="text-sm text-slate-600">
                This booking can no longer be confirmed through this page.
                Check My Bookings for its latest status.
              </p>
            )}

            <Link
              to="/dashboard"
              className="block text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Go to dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default BookingConfirmation;