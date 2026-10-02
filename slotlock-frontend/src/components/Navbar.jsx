import { Link, NavLink, useNavigate } from "react-router-dom";
import { isAuthenticated, clearTokens } from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const linkClass = ({ isActive }) =>
    `transition-colors ${
      isActive
        ? "font-semibold text-indigo-600"
        : "text-slate-600 hover:text-indigo-600"
    }`;

  const handleLogout = () => {
    clearTokens();
    navigate("/login", { replace: true });
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          to={authenticated ? "/dashboard" : "/"}
          className="text-2xl font-bold text-indigo-600"
        >
          SlotLock
        </Link>

        <div className="flex items-center gap-6">
          {!authenticated && (
            <>
              <NavLink to="/" className={linkClass}>
                Home
              </NavLink>

              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>

              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-700"
              >
                Get Started
              </Link>
            </>
          )}

          {authenticated && (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>

              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;