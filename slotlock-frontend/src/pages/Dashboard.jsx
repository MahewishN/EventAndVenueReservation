import { useNavigate } from "react-router-dom";
import { clearTokens } from "../utils/auth";
import { Link } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearTokens();
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              SLOTLOCK
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Dashboard
            </h1>

            <p className="mt-2 text-slate-600">
              Welcome back! Manage your venue bookings from here.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {/* Browse Venues */}
          <Link
            to="/resources"
            className="block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-semibold text-slate-900">
              Browse Venues
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Explore available venues and find a space for your event.
            </p>

            <span className="mt-4 inline-block text-sm font-semibold text-indigo-600">
              Explore venues →
            </span>
          </Link>

          {/* My Bookings */}
          <Link
            to="/my-bookings"
            className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-medium text-slate-900">
              My Bookings
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              View and manage your reservations.
            </p>

            <span className="mt-4 inline-block text-sm font-medium text-indigo-600">
              View bookings →
            </span>
          </Link>

          {/* Account */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Account
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Your account and profile information.
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}

export default Dashboard;
