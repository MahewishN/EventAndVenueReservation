import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const formatTime = (time) => time?.slice(0, 5) ?? "--";

function StatCard({ label, value, description }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value ?? 0}
      </p>

      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </article>
  );
}

function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [resources, setResources] = useState([]);
  const [peakTimes, setPeakTimes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      const [overviewResponse, resourcesResponse, peakTimesResponse] =
        await Promise.all([
          axiosInstance.get("/api/admin/analytics/overview"),
          axiosInstance.get("/api/admin/analytics/resources"),
          axiosInstance.get("/api/admin/analytics/peak-time"),
        ]);

      setOverview(overviewResponse.data);
      setResources(resourcesResponse.data);
      setPeakTimes(peakTimesResponse.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard analytics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <main className="px-4 py-16">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-slate-600">Loading admin dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-bold text-red-800">
            Dashboard unavailable
          </h1>

          <p className="mt-2 text-sm text-red-700">{error}</p>

          <button
            onClick={fetchAnalytics}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              SlotLock Administration
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-slate-600">
              Overview of your venues, bookings, and slot availability.
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-100"
          >
            Refresh analytics
          </button>
        </div>

        {/* Booking statistics */}
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Booking Overview
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Total Bookings"
              value={overview?.totalBookings}
              description="All recorded bookings"
            />

            <StatCard
              label="Pending"
              value={overview?.pendingBookings}
              description="Awaiting confirmation"
            />

            <StatCard
              label="Confirmed"
              value={overview?.confirmedBookings}
              description="Successfully confirmed"
            />

            <StatCard
              label="Cancelled"
              value={overview?.cancelledBookings}
              description="Cancelled bookings"
            />

            <StatCard
              label="Expired"
              value={overview?.expiredBookings}
              description="Bookings that expired"
            />
          </div>
        </section>

        {/* Resource and slot statistics */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Venue & Slot Overview
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Total Resources"
              value={overview?.totalResources}
              description="All registered venues"
            />

            <StatCard
              label="Active Resources"
              value={overview?.activeResources}
              description="Venues currently active"
            />

            <StatCard
              label="Total Slots"
              value={overview?.totalSlots}
              description="Generated slots across venues"
            />
          </div>
        </section>

        {/* Resource performance */}
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Resource Booking Statistics
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Booking counts and utilization for each venue.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-semibold">Resource</th>
                  <th className="px-5 py-4 font-semibold">Bookings</th>
                  <th className="px-5 py-4 font-semibold">Confirmed</th>
                  <th className="px-5 py-4 font-semibold">Total Slots</th>
                  <th className="px-5 py-4 font-semibold">Utilization</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {resources.map((resource) => (
                  <tr key={resource.resourceId}>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {resource.resourceName}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {resource.totalBookings}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {resource.confirmedBookings}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {resource.totalSlots}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {Number(resource.utilizationPercentage).toFixed(2)}%
                    </td>
                  </tr>
                ))}

                {resources.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      No resource statistics available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Peak booking times */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">
            Peak Booking Times
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Time slots ranked by confirmed booking count, as returned by the
            backend.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {peakTimes.map((item, index) => (
              <article
                key={`${item.startTime}-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-slate-500">Start time</p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatTime(item.startTime)}
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  {item.confirmedBookings} confirmed{" "}
                  {item.confirmedBookings === 1 ? "booking" : "bookings"}
                </p>
              </article>
            ))}

            {peakTimes.length === 0 && (
              <p className="text-sm text-slate-500">
                No peak-time data available yet.
              </p>
            )}
          </div>
        </section>

        {/* Admin shortcuts */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Management
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/admin/resources"
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm"
            >
              <h3 className="font-semibold text-slate-900">
                Manage Resources
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Create, edit, and activate or deactivate venues.
              </p>

              <span className="mt-4 inline-block font-semibold text-indigo-600">
                Manage resources →
              </span>
            </Link>

            <Link
              to="/admin/slots"
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm"
            >
              <h3 className="font-semibold text-slate-900">
                Manage Slots
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Generate slots and block or unblock availability.
              </p>

              <span className="mt-4 inline-block font-semibold text-indigo-600">
                Manage slots →
              </span>
            </Link>

            <Link to="/admin/bookings" 
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm" > 
              <h3 className="font-semibold text-slate-900"> Manage Bookings </h3> 
              <p className="mt-2 text-sm text-slate-600"> 
                View and manage customer bookings and their status. 
              </p> 
              <span className="mt-4 inline-block font-semibold text-indigo-600"> 
                Manage bookings → 
              </span> 
                
              </Link>

          </div>
        </section>
      </div>
    </main>
  );
}

export default AdminDashboard;