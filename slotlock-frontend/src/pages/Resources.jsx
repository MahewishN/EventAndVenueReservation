import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const formatResourceType = (type) =>
  type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await axiosInstance.get("/api/resources");

        const activeResources = response.data.filter(
          (resource) => resource.active === true
        );

        setResources(activeResources);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load resources. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Explore SlotLock
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
            Find your perfect venue
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Explore our venues, compare their facilities, and
            find a space for your next event.
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-slate-600">
              Loading venues...
            </p>
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"
          >
            {error}

            <button
              onClick={() => window.location.reload()}
              className="ml-3 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && resources.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              No venues available
            </h2>

            <p className="mt-2 text-slate-600">
              There are currently no active venues available
              for booking. Please check again later.
            </p>

            <Link
              to="/"
              className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Back to Home
            </Link>
          </div>
        )}

        {!loading && !error && resources.length > 0 && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {resources.length}{" "}
                {resources.length === 1 ? "venue" : "venues"} available
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource) => (
                <article
                  key={resource.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-700">
                    <span className="text-5xl font-bold text-white">
                      {resource.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="mb-3">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {formatResourceType(resource.type)}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900">
                      {resource.name}
                    </h2>

                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-medium text-slate-700">
                        Location:
                      </span>{" "}
                      {resource.location}
                    </p>

                    <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-slate-500">
                          Capacity
                        </span>
                        <span className="font-medium text-slate-800">
                          {resource.capacity} people
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-slate-500">
                          Operating hours
                        </span>
                        <span className="font-medium text-slate-800">
                          {resource.openTime} – {resource.closeTime}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-slate-500">
                          Slot duration
                        </span>
                        <span className="font-medium text-slate-800">
                          {resource.slotDurationMins} minutes
                        </span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Link
                        to={`/resources/${resource.id}`}
                        className="block rounded-lg bg-indigo-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-indigo-700"
                      >
                        View Availability
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default Resources;