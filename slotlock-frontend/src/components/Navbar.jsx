import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import axiosInstance from "../api/axiosInstance";
import {
  isAuthenticated,
  clearTokens,
} from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const authenticated = isAuthenticated();

  const [role, setRole] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchCurrentUser = async () => {
      if (!authenticated) {
        setRole(null);
        return;
      }

      try {
        const response = await axiosInstance.get("/api/users/me");

        if (active) {
          setRole(response.data.role);
        }
      } catch {
        if (active) {
          setRole(null);
        }
      }
    };

    fetchCurrentUser();

    return () => {
      active = false;
    };
  }, [authenticated, location.pathname]);

  const isAdmin = role === "ADMIN";

  const linkClass = ({ isActive }) =>
    `transition-colors ${
      isActive
        ? "font-semibold text-indigo-600"
        : "text-slate-600 hover:text-indigo-600"
    }`;

  const handleLogout = () => {
    clearTokens();
    setRole(null);
    navigate("/login", { replace: true });
  };

  const logoDestination = isAdmin
    ? "/admin/dashboard"
    : "/dashboard";

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          to={authenticated ? logoDestination : "/"}
          className="text-2xl font-bold text-indigo-600"
        >
          SlotLock
        </Link>

        <div className="flex items-center gap-6">
          {/* Logged out */}
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

          {/* Logged in */}
          {authenticated && (
            <>
              {/* Admin navigation */}
              {isAdmin && (
                <NavLink
                  to="/admin/dashboard"
                  className={linkClass}
                >
                  Admin Dashboard
                </NavLink>
              )}

              {/* Normal dashboard */}
              <NavLink
                to="/dashboard"
                className={linkClass}
              >
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