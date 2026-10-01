import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-bold text-indigo-600">404</h1>

      <p className="mt-4 text-xl text-slate-700">
        This page doesn't exist.
      </p>

      <Link
        to="/"
        className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
      >
        Back to Home
      </Link>
    </main>
  );
}

export default NotFound;