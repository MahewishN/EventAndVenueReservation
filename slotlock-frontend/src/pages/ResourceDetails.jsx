import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { isAuthenticated } from "../utils/auth";

const formatResourceType = (type = "") =>
  type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatTime = (time) => time?.slice(0, 5) ?? "";

const statusStyles = {
  AVAILABLE: "border-green-200 bg-green-50 text-green-700",
  BOOKED: "border-blue-200 bg-blue-50 text-blue-700",
  BLOCKED: "border-red-200 bg-red-50 text-red-700",
  EXPIRED: "border-slate-200 bg-slate-100 text-slate-600",
};

function ResourceDetails() {
  const { resourceId } = useParams();

  const [resource, setResource] = useState(null);
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState(getToday());

  const [resourceLoading, setResourceLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(true);

  const [resourceError, setResourceError] = useState("");
  const [slotsError, setSlotsError] = useState("");

  const navigate = useNavigate();

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSlotId, setBookingSlotId] = useState(null);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    const fetchResource = async () => {
      setResourceLoading(true);
      setResourceError("");

      try {
        const response = await axiosInstance.get(
          `/api/resources/${resourceId}`
        );

        setResource(response.data);
      } catch (err) {
        setResourceError(
          err.response?.data?.message ||
            "Unable to load this venue. Please try again."
        );
      } finally {
        setResourceLoading(false);
      }
    };

    fetchResource();
  }, [resourceId]);

  useEffect(() => {
    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSlotsError("");
      setSlots([]);

      try {
        const response = await axiosInstance.get(
          `/api/resources/${resourceId}/slots`,
          {
            params: { date },
          }
        );

        setSlots(response.data);
      } catch (err) {
        setSlotsError(
          err.response?.data?.message ||
            "Unable to load slots for this date."
        );
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [resourceId, date]);

  const handleCreateBooking = async (slotId) => {
    if (!isAuthenticated()) {
      navigate("/login", {
        state: { from: `/resources/${resourceId}` },
      });
      return;
    }

    if (bookingLoading || !resource?.active) {
      return;
    }

    setBookingLoading(true);
    setBookingSlotId(slotId);
    setBookingError("");
    setBookingSuccess(null);

    try {
      const response = await axiosInstance.post("/api/bookings", {
        slotId,
      });

      const booking = response.data;

      const createdBookingId = booking?.id ?? booking?.bookingId;

      if (createdBookingId != null) {
        navigate(`/bookings/${createdBookingId}/confirm`);
        return;   
      }

      setBookingSuccess({
        id: booking?.id ?? booking?.bookingId ?? null,
        slotId,
      });

      // Refresh the slot status after a successful booking.
      const slotsResponse = await axiosInstance.get(
        `/api/resources/${resourceId}/slots`,
        { params: { date } }
      );

      setSlots(slotsResponse.data);
    } catch (err) {
      setBookingError(
        err.response?.data?.message ||
          "Unable to create your booking. The slot may no longer be available."
      );
    } finally {
      setBookingLoading(false);
      setBookingSlotId(null);
    }
  };

  const availableCount = slots.filter(
    (slot) => slot.status === "AVAILABLE"
  ).length;

  if (resourceLoading) {
    return (
      <main className="px-4 py-16">
        <div className="mx-auto max-w-5xl rounded-xl border bg-white p-10 text-center">
          <p className="text-slate-600">Loading venue details...</p>
        </div>
      </main>
    );
  }

  if (resourceError || !resource) {
    return (
      <main className="px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="text-xl font-bold text-red-800">
            Unable to load venue
          </h1>

          <p className="mt-2 text-red-700">
            {resourceError || "Venue not found."}
          </p>

          <Link
            to="/resources"
            className="mt-6 inline-block font-semibold text-indigo-600 hover:text-indigo-700"
          >
            ← Back to venues
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/resources"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to venues
        </Link>

        {/* Resource details */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-700 to-violet-700 px-6 py-10 text-white md:px-10">
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
              {formatResourceType(resource.type)}
            </span>

            <h1 className="mt-5 text-3xl font-bold md:text-4xl">
              {resource.name}
            </h1>

            <p className="mt-3 text-indigo-100">
              {resource.location}
            </p>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4 md:p-8">
            <Detail
              label="Capacity"
              value={`${resource.capacity} people`}
            />

            <Detail
              label="Opening time"
              value={formatTime(resource.openTime)}
            />

            <Detail
              label="Closing time"
              value={formatTime(resource.closeTime)}
            />

            <Detail
              label="Slot duration"
              value={`${resource.slotDurationMins} minutes`}
            />
          </div>

          {!resource.active && (
            <div className="border-t border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800">
              This venue is currently inactive and unavailable for new bookings.
            </div>
          )}
        </section>

        {/* Slot availability */}
        <section className="mt-10">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
                Availability
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
                Choose your date
              </h2>

              <p className="mt-2 text-slate-600">
                Check the time slots available for this venue.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <label
                htmlFor="slot-date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Select date
              </label>

              <input
                id="slot-date"
                type="date"
                min={getToday()}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <StatusLegend color="green" label="Available" />
            <StatusLegend color="blue" label="Booked" />
            <StatusLegend color="red" label="Blocked" />
            <StatusLegend color="slate" label="Expired" />
          </div>

          {slotsLoading && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-slate-600">
                Loading slots...
              </p>
            </div>
          )}

          {!slotsLoading && slotsError && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"
            >
              {slotsError}
            </div>
          )}

          {!slotsLoading && !slotsError && slots.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <h3 className="text-lg font-semibold text-slate-900">
                No slots found
              </h3>

              <p className="mt-2 text-slate-600">
                There are no generated slots for this venue on{" "}
                {date}.
              </p>
            </div>
          )}

          {!slotsLoading && !slotsError && slots.length > 0 && (
            <>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  {slots.length} total{" "}
                  {slots.length === 1 ? "slot" : "slots"}
                </p>

                <p className="text-sm font-semibold text-green-700">
                  {availableCount} available
                </p>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {slots.map((slot) => (
                  <article
                    key={slot.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-slate-900">
                          {formatTime(slot.startTime)} –{" "}
                          {formatTime(slot.endTime)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Slot #{slot.id}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusStyles[slot.status] ||
                          statusStyles.EXPIRED
                        }`}
                      >
                        {formatResourceType(slot.status)}
                      </span>
                    </div>

                    {/* Available slot booking section */}
                    {slot.status === "AVAILABLE" && (
                      <>
                        <p className="mt-4 text-sm text-green-700">
                          This time slot is available.
                        </p>

                        {isAuthenticated() ? (
                          <button
                            type="button"
                            onClick={() => handleCreateBooking(slot.id)}
                            disabled={
                              bookingLoading || !resource.active
                            }
                            className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {bookingLoading &&
                            bookingSlotId === slot.id
                              ? "Creating booking..."
                              : "Book Slot"}
                          </button>
                        ) : (
                          <Link
                            to="/login"
                            state={{
                              from: `/resources/${resourceId}`,
                            }}
                            className="mt-4 block rounded-lg bg-indigo-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-indigo-700"
                          >
                            Sign in to book
                          </Link>
                        )}
                      </>
                    )}

                    {slot.status !== "AVAILABLE" && (
                      <p className="mt-4 text-sm text-slate-500">
                        This time slot cannot currently be booked.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}

          {/* Booking error */}
          {bookingError && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {bookingError}
            </div>
          )}

          {/* Booking success */}
          {bookingSuccess && (
            <div
              role="status"
              className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5"
            >
              <h3 className="font-semibold text-green-900">
                Booking created successfully!
              </h3>

              {bookingSuccess.id != null && (
                <p className="mt-1 text-sm text-green-800">
                  Booking ID: {bookingSuccess.id}
                </p>
              )}

              <p className="mt-2 text-sm leading-6 text-green-800">
                Your booking is pending. You must confirm it within the
                10-minute confirmation window.
              </p>
            </div>
          )}

          <div className="mt-8 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <h3 className="font-semibold text-indigo-900">
              Ready to reserve a slot?
            </h3>

            <p className="mt-1 text-sm leading-6 text-indigo-800">
              {isAuthenticated()
                ? "You are signed in. Booking functionality is the next step."
                : "Sign in or create an account when you're ready to book a venue."}
            </p>

            {!isAuthenticated() && (
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  state={{ from: `/resources/${resourceId}` }}
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700"
                >
                  Sign in
                </Link>

                <Link
                  to="/register"
                  className="rounded-lg border border-indigo-200 bg-white px-5 py-2.5 font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StatusLegend({ color, label }) {
  const colors = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    red: "bg-red-500",
    slate: "bg-slate-400",
  };

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-600">
      <span className={`h-2.5 w-2.5 rounded-full ${colors[color]}`} />
      {label}
    </span>
  );
}

export default ResourceDetails;