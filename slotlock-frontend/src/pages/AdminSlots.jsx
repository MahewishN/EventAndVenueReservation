import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const getToday = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatTime = (time) => time?.slice(0, 5) ?? "--";

const formatStatus = (status = "") =>
  status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const statusStyles = {
  AVAILABLE: "border-green-200 bg-green-50 text-green-700",
  BOOKED: "border-blue-200 bg-blue-50 text-blue-700",
  BLOCKED: "border-red-200 bg-red-50 text-red-700",
  EXPIRED: "border-slate-200 bg-slate-100 text-slate-600",
};

function AdminSlots() {
  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [date, setDate] = useState(getToday());

  const [slots, setSlots] = useState([]);

  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [updatingSlotId, setUpdatingSlotId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load resources
  const fetchResources = async () => {
    setResourcesLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get("/api/resources");

      const activeResources = response.data.filter(
        (resource) => resource.active
      );

      setResources(activeResources);

      if (activeResources.length > 0) {
        setSelectedResourceId((current) =>
          current || String(activeResources[0].id)
        );
      } else {
        setSelectedResourceId("");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load resources. Please try again."
      );
    } finally {
      setResourcesLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Load slots whenever resource or date changes
  const fetchSlots = async () => {
    if (!selectedResourceId || !date) {
      setSlots([]);
      return;
    }

    setSlotsLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get(
        `/api/resources/${selectedResourceId}/slots`,
        {
          params: { date },
        }
      );

      setSlots(response.data);
    } catch (err) {
      setSlots([]);

      setError(
        err.response?.data?.message ||
          "Unable to load slots for the selected resource and date."
      );
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedResourceId, date]);

  // Generate slots
  const handleGenerateSlots = async () => {
    if (!date) {
      setError("Please select a date first.");
      return;
    }

    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      await axiosInstance.post("/api/admin/slots/generate", {
        date,
      });

      setSuccess(
        `Slots generated successfully for ${date}.`
      );

      // Refresh the currently selected resource's slots
      await fetchSlots();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to generate slots. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  // Block / unblock slot
  const handleStatusChange = async (slot) => {
    if (slot.status === "BOOKED" || slot.status === "EXPIRED") {
      return;
    }

    const shouldBlock = slot.status === "AVAILABLE";

    const action = shouldBlock ? "block" : "unblock";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this slot (${formatTime(
        slot.startTime
      )} - ${formatTime(slot.endTime)})?`
    );

    if (!confirmed) {
      return;
    }

    setUpdatingSlotId(slot.id);
    setError("");
    setSuccess("");

    try {
      await axiosInstance.patch(
        `/api/slots/${slot.id}/status`,
        {
          blocked: shouldBlock,
        }
      );

      setSuccess(
        `Slot ${shouldBlock ? "blocked" : "unblocked"} successfully.`
      );

      await fetchSlots();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update slot status. Please try again."
      );
    } finally {
      setUpdatingSlotId(null);
    }
  };

  const availableCount = slots.filter(
    (slot) => slot.status === "AVAILABLE"
  ).length;

  const bookedCount = slots.filter(
    (slot) => slot.status === "BOOKED"
  ).length;

  const blockedCount = slots.filter(
    (slot) => slot.status === "BLOCKED"
  ).length;

  const expiredCount = slots.filter(
    (slot) => slot.status === "EXPIRED"
  ).length;

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              SlotLock Administration
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Slot Management
            </h1>

            <p className="mt-2 text-slate-600">
              Generate, view, and manage venue time slots.
            </p>
          </div>

          <Link
            to="/admin/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center font-medium text-slate-700 transition hover:bg-slate-100"
          >
            ← Admin Dashboard
          </Link>
        </div>

        {/* Messages */}
        {success && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Generate Slots */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Generate Slots
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Generate slots for the selected date. The backend generates
              slots for all currently active resources.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="generate-date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Date
              </label>

              <input
                id="generate-date"
                type="date"
                min={getToday()}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateSlots}
              disabled={generating || !date}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? "Generating..." : "Generate Slots"}
            </button>
          </div>
        </section>

        {/* Filters */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              View Slots
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select a resource and date to view its generated slots.
            </p>
          </div>

          {resourcesLoading ? (
            <div className="mt-6">
              <p className="text-sm text-slate-600">
                Loading resources...
              </p>
            </div>
          ) : resources.length === 0 ? (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No active resources are available. Activate a resource from
              Resource Management before generating slots.
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {/* Resource */}
              <div>
                <label
                  htmlFor="resource-select"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Resource
                </label>

                <select
                  id="resource-select"
                  value={selectedResourceId}
                  onChange={(event) =>
                    setSelectedResourceId(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  {resources.map((resource) => (
                    <option
                      key={resource.id}
                      value={resource.id}
                    >
                      {resource.name} — {resource.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label
                  htmlFor="view-date"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Date
                </label>

                <input
                  id="view-date"
                  type="date"
                  value={date}
                  min={getToday()}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          )}
        </section>

        {/* Slot statistics */}
        {!resourcesLoading && selectedResourceId && (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Available"
              value={availableCount}
              description="Slots available for booking"
            />

            <StatCard
              label="Booked"
              value={bookedCount}
              description="Slots currently booked"
            />

            <StatCard
              label="Blocked"
              value={blockedCount}
              description="Slots blocked by admin"
            />

            <StatCard
              label="Expired"
              value={expiredCount}
              description="Past slots"
            />
          </section>
        )}

        {/* Slot list */}
        {!resourcesLoading && selectedResourceId && (
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Slots
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {date} —{" "}
                {
                  resources.find(
                    (resource) =>
                      String(resource.id) === String(selectedResourceId)
                  )?.name
                }
              </p>
            </div>

            {slotsLoading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <p className="text-slate-600">
                  Loading slots...
                </p>
              </div>
            ) : slots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <h3 className="text-lg font-semibold text-slate-900">
                  No slots found
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  No slots have been generated for this resource on{" "}
                  {date}.
                </p>

                <button
                  type="button"
                  onClick={handleGenerateSlots}
                  disabled={generating}
                  className="mt-5 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {generating
                    ? "Generating..."
                    : "Generate Slots"}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full min-w-[750px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Slot
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Start
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        End
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Status
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {slots.map((slot) => {
                      const canChange =
                        slot.status === "AVAILABLE" ||
                        slot.status === "BLOCKED";

                      const isUpdating =
                        updatingSlotId === slot.id;

                      return (
                        <tr key={slot.id}>
                          <td className="px-5 py-4 font-medium text-slate-900">
                            #{slot.id}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {formatTime(slot.startTime)}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {formatTime(slot.endTime)}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                statusStyles[slot.status] ||
                                statusStyles.EXPIRED
                              }`}
                            >
                              {formatStatus(slot.status)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            {canChange ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusChange(slot)
                                }
                                disabled={isUpdating}
                                className={`rounded-lg px-3 py-1.5 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                  slot.status === "AVAILABLE"
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-green-600 hover:bg-green-700"
                                }`}
                              >
                                {isUpdating
                                  ? "Updating..."
                                  : slot.status === "AVAILABLE"
                                    ? "Block"
                                    : "Unblock"}
                              </button>
                            ) : (
                              <span className="text-sm text-slate-400">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Status information */}
        <section className="mt-8 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
          <h3 className="font-semibold text-indigo-900">
            Slot status rules
          </h3>

          <ul className="mt-3 space-y-2 text-sm leading-6 text-indigo-800">
            <li>
              • <strong>Available:</strong> Users can book the slot.
            </li>

            <li>
              • <strong>Booked:</strong> The slot is currently associated
              with a booking and cannot be blocked.
            </li>

            <li>
              • <strong>Blocked:</strong> The slot is unavailable for
              booking until the admin unblocks it.
            </li>

            <li>
              • <strong>Expired:</strong> The slot belongs to a past date
              and cannot be modified through this page.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, description }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-500">
        {description}
      </p>
    </article>
  );
}

export default AdminSlots;