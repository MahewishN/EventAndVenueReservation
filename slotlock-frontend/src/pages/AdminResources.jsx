import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const RESOURCE_TYPES = [
  "SEMINAR_HALL",
  "WEDDING_HALL",
  "TURF",
  "CONFERENCE_ROOM",
  "AUDITORIUM",
  "OTHER",
];

const emptyForm = {
  name: "",
  type: "",
  location: "",
  capacity: "",
  openTime: "",
  closeTime: "",
  slotDurationMins: "",
};

const formatTime = (time) => time?.slice(0, 5) ?? "--";

function AdminResources() {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [editingResource, setEditingResource] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchResources = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get("/api/resources");
      setResources(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load resources. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingResource(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const requestBody = {
      name: form.name.trim(),
      type: form.type,
      location: form.location.trim(),
      capacity: Number(form.capacity),
      openTime: form.openTime,
      closeTime: form.closeTime,
      slotDurationMins: Number(form.slotDurationMins),
    };

    try {
      if (editingResource) {
        await axiosInstance.post(
          `/api/resources/${editingResource.id}`,
          requestBody
        );

        setSuccess("Resource updated successfully.");
      } else {
        await axiosInstance.post("/api/resources", requestBody);

        setSuccess("Resource created successfully.");
      }

      resetForm();
      await fetchResources();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save resource. Please check the entered details."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);

    setForm({
      name: resource.name ?? "",
      type: resource.type ?? "",
      location: resource.location ?? "",
      capacity: resource.capacity ?? "",
      openTime: formatTime(resource.openTime),
      closeTime: formatTime(resource.closeTime),
      slotDurationMins: resource.slotDurationMins ?? "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleStatusChange = async (resource) => {
    const action = resource.active ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${resource.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await axiosInstance.patch(`/api/resources/${resource.id}/status`, {
        active: !resource.active,
      });

      setSuccess(
        `Resource ${resource.active ? "deactivated" : "activated"} successfully.`
      );

      await fetchResources();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update resource status. Please try again."
      );
    }
  };

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
              Resource Management
            </h1>

            <p className="mt-2 text-slate-600">
              Create, edit, and manage the availability of your venues.
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

        {/* Create / Edit Form */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              {editingResource ? "Edit Resource" : "Create Resource"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {editingResource
                ? "Update the venue details below."
                : "Add a new venue that users can book."}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Resource Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Royal Wedding Hall"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Resource Type
                </label>

                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Select resource type</option>

                  {RESOURCE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type
                        .toLowerCase()
                        .split("_")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Location
                </label>

                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Nashik"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Capacity
                </label>

                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  min="10"
                  required
                  placeholder="e.g. 500"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Minimum capacity: 10
                </p>
              </div>

              {/* Opening Time */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Opening Time
                </label>

                <input
                  type="time"
                  name="openTime"
                  value={form.openTime}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Closing Time */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Closing Time
                </label>

                <input
                  type="time"
                  name="closeTime"
                  value={form.closeTime}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Slot Duration */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Slot Duration (minutes)
                </label>

                <input
                  type="number"
                  name="slotDurationMins"
                  value={form.slotDurationMins}
                  onChange={handleChange}
                  min="30"
                  required
                  placeholder="e.g. 60"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Minimum duration: 30 minutes
                </p>
              </div>
            </div>

            {/* Form actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingResource
                    ? "Update Resource"
                    : "Create Resource"}
              </button>

              {editingResource && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Resource List */}
        <section className="mt-10">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                All Resources
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage all registered venues, including inactive ones.
              </p>
            </div>

            <button
              onClick={fetchResources}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-slate-600">Loading resources...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Resource</th>
                    <th className="px-5 py-4 font-semibold">Type</th>
                    <th className="px-5 py-4 font-semibold">Location</th>
                    <th className="px-5 py-4 font-semibold">Capacity</th>
                    <th className="px-5 py-4 font-semibold">Hours</th>
                    <th className="px-5 py-4 font-semibold">Slot</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {resources.map((resource) => (
                    <tr key={resource.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {resource.name}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {resource.type}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {resource.location}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {resource.capacity}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatTime(resource.openTime)} -{" "}
                        {formatTime(resource.closeTime)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {resource.slotDurationMins} min
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            resource.active
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {resource.active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEdit(resource)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleStatusChange(resource)}
                            className={`rounded-lg px-3 py-1.5 font-medium text-white ${
                              resource.active
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {resource.active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {resources.length === 0 && (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No resources have been created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default AdminResources;