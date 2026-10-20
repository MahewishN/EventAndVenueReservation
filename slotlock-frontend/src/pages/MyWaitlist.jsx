
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const formatStatus = (status = "") =>
  status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const statusStyles = {
  WAITING: "border-amber-200 bg-amber-50 text-amber-700",
  OFFERED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  EXPIRED: "border-slate-200 bg-slate-100 text-slate-600",
  CONVERTED: "border-green-200 bg-green-50 text-green-700",
};

function MyWaitlist() {
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [positions, setPositions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);

  const fetchWaitlist = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get("/api/waitlist/my");
      const data = Array.isArray(response.data) ? response.data : [];

      setEntries(data);

      const waitingEntries = data.filter(
        (entry) => entry.status === "WAITING"
      );

      const positionResults = await Promise.all(
        waitingEntries.map(async (entry) => {
          try {
            const positionResponse = await axiosInstance.get(
              `/api/waitlist/${entry.id}/position`
            );

            return [
              entry.id,
              positionResponse.data.position,
            ];
          } catch {
            // The queue may change while positions are being fetched.
            return [entry.id, null];
          }
        })
      );

      setPositions(Object.fromEntries(positionResults));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your waitlist. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWaitlist();
  }, [fetchWaitlist]);

  const handleConfirmOffer = async (entryId) => {
    setConfirmingId(entryId);
    setActionError("");
    setMessage("");

    try {
      const response = await axiosInstance.post(
        `/api/waitlist/${entryId}/confirm`
      );

      const booking = response.data;
      setMessage(
        `Waitlist offer confirmed successfully. Booking ID: ${
          booking?.id ?? booking?.bookingId ?? "created"
        }.`
      );

      await fetchWaitlist();
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Unable to confirm this offer. It may have expired or the slot may no longer be available."
      );

      await fetchWaitlist();
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Your queue
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              My Waitlist
            </h1>

            <p className="mt-2 text-slate-600">
              Track your queue positions and confirm available offers
              before they expire.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={fetchWaitlist}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Refresh
            </button>

            <Link
              to="/resources"
              className="rounded-lg bg-indigo-600 px-5 py-3 text-center font-semibold text-white hover:bg-indigo-700"
            >
              Browse venues
            </Link>
          </div>
        </div>

        {message && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {message}
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {actionError}
          </div>
        )}

        {loading && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-slate-600">
              Loading your waitlist...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="text-red-700">{error}</p>

            <button
              type="button"
              onClick={fetchWaitlist}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <span className="text-2xl">◷</span>
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Your waitlist is empty
            </h2>

            <p className="mt-2 text-slate-600">
              When a venue slot is booked, you can join its waitlist
              from the venue details page.
            </p>

            <Link
              to="/resources"
              className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Explore venues
            </Link>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <>
            <p className="mt-8 text-sm text-slate-600">
              {entries.length}{" "}
              {entries.length === 1 ? "entry" : "entries"}
            </p>

            <div className="mt-4 grid gap-5 lg:grid-cols-2">
              {entries.map((entry) => {
                const isWaiting = entry.status === "WAITING";
                const isOffered = entry.status === "OFFERED";

                return (
                  <article
                    key={entry.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Waitlist entry #{entry.id}
                        </p>

                        <h2 className="mt-2 text-xl font-bold text-slate-900">
                          {entry.resourceName || "Venue"}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Slot #{entry.slotId}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusStyles[entry.status] ||
                          "border-slate-200 bg-slate-100 text-slate-700"
                        }`}
                      >
                        {formatStatus(entry.status)}
                      </span>
                    </div>

                    <div className="grid gap-5 p-5 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-500">
                          Joined at
                        </p>
                        <p className="mt-1 font-medium text-slate-900">
                          {formatDateTime(entry.joinedAt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Queue position
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {isWaiting
                            ? positions[entry.id] != null
                              ? `#${positions[entry.id]}`
                              : "Updating..."
                            : "—"}
                        </p>
                      </div>

                      {entry.offeredAt && (
                        <div>
                          <p className="text-sm text-slate-500">
                            Offer received
                          </p>
                          <p className="mt-1 font-medium text-slate-900">
                            {formatDateTime(entry.offeredAt)}
                          </p>
                        </div>
                      )}

                      {entry.expiresAt && (
                        <div>
                          <p className="text-sm text-slate-500">
                            Offer expires at
                          </p>
                          <p className="mt-1 font-medium text-slate-900">
                            {formatDateTime(entry.expiresAt)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50 p-5">
                      {isWaiting && (
                        <p className="text-sm leading-6 text-amber-800">
                          You are in the queue. Your position can
                          change as offers are made to other users.
                        </p>
                      )}

                      {isOffered && (
                        <>
                          <p className="text-sm leading-6 text-indigo-800">
                            A slot has been offered to you. Confirm
                            before the expiry time to create your
                            booking.
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              handleConfirmOffer(entry.id)
                            }
                            disabled={confirmingId !== null}
                            className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {confirmingId === entry.id
                              ? "Confirming offer..."
                              : "Confirm Offer"}
                          </button>
                        </>
                      )}

                      {entry.status === "EXPIRED" && (
                        <p className="text-sm text-slate-600">
                          This waitlist entry has expired. Browse
                          venues to check current availability.
                        </p>
                      )}

                      {entry.status === "CONVERTED" && (
                        <p className="text-sm text-green-800">
                          This offer was converted into a booking.
                          View your bookings for its details.
                        </p>
                      )}

                      {entry.status === "CONVERTED" && (
                        <Link
                          to="/my-bookings"
                          className="mt-3 inline-block font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                          View my bookings →
                        </Link>
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

export default MyWaitlist;
