import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
];

const statusStyles = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  CONFIRMED: "border-green-200 bg-green-50 text-green-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
  EXPIRED: "border-slate-200 bg-slate-100 text-slate-600",
};

const formatStatus = (status = "") =>
  status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (date) => {
  if (!date) return "-";

  const [year, month, day] = date.split("-");
  return `${day}-${month}-${year}`;
};

const formatTime = (time) => time?.slice(0, 5) ?? "-";

const formatDateTime = (dateTime) => {
  if (!dateTime) return "-";

  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) {
    return dateTime;
  }

  return date.toLocaleString();
};

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);

  const [status, setStatus] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [date, setDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  const [error, setError] = useState("");
  const [resourceError, setResourceError] = useState("");

  const [selectedBooking, setSelectedBooking] = useState(null);

  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [status, resourceId, date]);

  const fetchResources = async () => {
    setResourcesLoading(true);
    setResourceError("");

    try {
      const response = await axiosInstance.get("/api/resources");

      setResources(response.data);
    } catch (err) {
      setResourceError(
        err.response?.data?.message ||
          "Unable to load resources."
      );
    } finally {
      setResourcesLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (status) {
        params.status = status;
      }

      if (resourceId) {
        params.resourceId = resourceId;
      }

      if (date) {
        params.date = date;
      }

      const response = await axiosInstance.get(
        "/api/admin/bookings",
        { params }
      );

      setBookings(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setStatus("");
    setResourceId("");
    setDate("");
    setSuccessMessage("");
    setError("");
  };

  const handleViewBooking = (booking) => {
    setCancelError("");
    setSelectedBooking(booking);
  };

  const closeBookingDetails = () => {
    if (cancelLoading) {
      return;
    }

    setSelectedBooking(null);
    setCancelError("");
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel booking #${selectedBooking.id}?`
    );

    if (!confirmed) {
      return;
    }

    setCancelLoading(true);
    setCancelError("");
    setSuccessMessage("");

    try {
      await axiosInstance.delete(
        `/api/admin/bookings/${selectedBooking.id}`
      );

      setSuccessMessage(
        `Booking #${selectedBooking.id} cancelled successfully.`
      );

      setSelectedBooking(null);

      await fetchBookings();
    } catch (err) {
      setCancelError(
        err.response?.data?.message ||
          "Unable to cancel this booking."
      );
    } finally {
      setCancelLoading(false);
    }
  };

  const canCancel =
    selectedBooking?.status === "PENDING" ||
    selectedBooking?.status === "CONFIRMED";

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              SlotLock Administration
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Booking Management
            </h1>

            <p className="mt-2 text-slate-600">
              View, filter, and manage venue bookings.
            </p>
          </div>

          <Link
            to="/admin/dashboard"
            className="inline-flex w-fit rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Admin Dashboard
          </Link>
        </div>

        {/* Success message */}
        {successMessage && (
          <div
            role="status"
            className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {successMessage}
          </div>
        )}

        {/* Filters */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Filter Bookings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Narrow down bookings by status, venue, or date.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearFilters}
              className="w-fit rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {/* Status */}
            <div>
              <label
                htmlFor="booking-status"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Status
              </label>

              <select
                id="booking-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All statuses</option>

                {BOOKING_STATUSES.map((bookingStatus) => (
                  <option
                    key={bookingStatus}
                    value={bookingStatus}
                  >
                    {formatStatus(bookingStatus)}
                  </option>
                ))}
              </select>
            </div>

            {/* Resource */}
            <div>
              <label
                htmlFor="booking-resource"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Venue
              </label>

              <select
                id="booking-resource"
                value={resourceId}
                onChange={(event) =>
                  setResourceId(event.target.value)
                }
                disabled={resourcesLoading}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              >
                <option value="">
                  {resourcesLoading
                    ? "Loading venues..."
                    : "All venues"}
                </option>

                {resources.map((resource) => (
                  <option
                    key={resource.id}
                    value={resource.id}
                  >
                    {resource.name}
                  </option>
                ))}
              </select>

              {resourceError && (
                <p className="mt-1 text-xs text-red-600">
                  {resourceError}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label
                htmlFor="booking-date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Date
              </label>

              <input
                id="booking-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </section>

        {/* Bookings */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Bookings
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {loading
                    ? "Loading bookings..."
                    : `${bookings.length} ${
                        bookings.length === 1
                          ? "booking"
                          : "bookings"
                      } found`}
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="p-12 text-center">
              <p className="text-slate-600">
                Loading bookings...
              </p>
            </div>
          )}

          {!loading && error && (
            <div
              role="alert"
              className="m-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {!loading && !error && bookings.length === 0 && (
            <div className="px-6 py-14 text-center">
              <h3 className="text-lg font-semibold text-slate-900">
                No bookings found
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Try changing the filters or check again later.
              </p>
            </div>
          )}

          {!loading && !error && bookings.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Booking
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Venue
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      User
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date & Time
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          #{booking.id}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Slot #{booking.slotId}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">
                          {booking.resourceName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Resource #{booking.resourceId}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">
                          User #{booking.userId}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">
                          {formatDate(booking.date)}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatTime(booking.startTime)} –{" "}
                          {formatTime(booking.endTime)}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                            statusStyles[booking.status] ||
                            statusStyles.EXPIRED
                          }`}
                        >
                          {formatStatus(booking.status)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleViewBooking(booking)
                          }
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Booking details modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
                  Booking Details
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Booking #{selectedBooking.id}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeBookingDetails}
                disabled={cancelLoading}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
              <Detail
                label="Booking ID"
                value={`#${selectedBooking.id}`}
              />

              <Detail
                label="Status"
                value={formatStatus(selectedBooking.status)}
              />

              <Detail
                label="Venue"
                value={selectedBooking.resourceName}
              />

              <Detail
                label="Resource ID"
                value={`#${selectedBooking.resourceId}`}
              />

              <Detail
                label="User ID"
                value={`#${selectedBooking.userId}`}
              />

              <Detail
                label="Slot ID"
                value={`#${selectedBooking.slotId}`}
              />

              <Detail
                label="Date"
                value={formatDate(selectedBooking.date)}
              />

              <Detail
                label="Time"
                value={`${formatTime(
                  selectedBooking.startTime
                )} – ${formatTime(selectedBooking.endTime)}`}
              />

              <Detail
                label="Booked At"
                value={formatDateTime(
                  selectedBooking.bookedAt
                )}
              />

              <Detail
                label="Expires At"
                value={formatDateTime(
                  selectedBooking.expiresAt
                )}
              />
            </div>

            {cancelError && (
              <div className="mx-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {cancelError}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeBookingDetails}
                disabled={cancelLoading}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Close
              </button>

              {canCancel && (
                <button
                  type="button"
                  onClick={handleCancelBooking}
                  disabled={cancelLoading}
                  className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancelLoading
                    ? "Cancelling..."
                    : "Cancel Booking"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default AdminBookings;