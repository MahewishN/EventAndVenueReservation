import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const formatTime = (time = "") => time.slice(0, 5);

const formatDate = (date = "") => {
  if (!date) return "";

  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatStatus = (status = "") =>
  status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const statusStyles = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  CONFIRMED: "border-green-200 bg-green-50 text-green-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
  EXPIRED: "border-slate-200 bg-slate-100 text-slate-600",
};

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState("");
  const [message, setMessage] = useState("");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get("/api/bookings/me");
      setBookings(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your bookings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (bookingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

    setCancellingId(bookingId);
    setCancelError("");
    setMessage("");

    try {
      await axiosInstance.delete(`/api/bookings/${bookingId}`);

      setMessage(`Booking #${bookingId} cancelled successfully.`);

      await fetchBookings();
    } catch (err) {
      setCancelError(
        err.response?.data?.message ||
          "Unable to cancel this booking. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Your reservations
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              My Bookings
            </h1>

            <p className="mt-2 text-slate-600">
              View and manage your venue reservations.
            </p>
          </div>

          <Link
            to="/resources"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Browse venues
          </Link>
        </div>

        {message && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {message}
          </div>
        )}

        {cancelError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {cancelError}
          </div>
        )}

        {loading && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-slate-600">Loading your bookings...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="text-red-700">{error}</p>

            <button
              type="button"
              onClick={fetchBookings}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <span className="text-2xl">▦</span>
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No bookings yet
            </h2>

            <p className="mt-2 text-slate-600">
              Your reservations will appear here once you book a venue.
            </p>

            <Link
              to="/resources"
              className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Explore venues
            </Link>
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <>
            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {bookings.length}{" "}
                {bookings.length === 1 ? "booking" : "bookings"}
              </p>

              <button
                type="button"
                onClick={fetchBookings}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 grid gap-5 lg:grid-cols-2">
              {bookings.map((booking) => {
                const isPending = booking.status === "PENDING";
                const isConfirmed = booking.status === "CONFIRMED";
                const isCancellable =
                  isPending || isConfirmed;

                return (
                  <article
                    key={booking.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Booking #{booking.id}
                        </p>

                        <h2 className="mt-2 text-xl font-bold text-slate-900">
                          {booking.resourceName}
                        </h2>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusStyles[booking.status] ||
                          "border-slate-200 bg-slate-100 text-slate-700"
                        }`}
                      >
                        {formatStatus(booking.status)}
                      </span>
                    </div>

                    <div className="grid gap-5 p-5 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-500">Date</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatDate(booking.date)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Time</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatTime(booking.startTime)} –{" "}
                          {formatTime(booking.endTime)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Slot ID</p>
                        <p className="mt-1 font-medium text-slate-800">
                          #{booking.slotId}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Booked at</p>
                        <p className="mt-1 font-medium text-slate-800">
                          {booking.bookedAt
                            ? new Date(
                                booking.bookedAt
                              ).toLocaleString("en-IN")
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 border-t border-slate-100 bg-slate-50 p-5">
                      {isPending && (
                        <Link
                          to={`/bookings/${booking.id}/confirm`}
                          className="inline-flex flex-1 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                          Confirm booking
                        </Link>
                      )}

                      {isCancellable && (
                        <button
                          type="button"
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="inline-flex flex-1 items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancellingId === booking.id
                            ? "Cancelling..."
                            : "Cancel booking"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default MyBookings;