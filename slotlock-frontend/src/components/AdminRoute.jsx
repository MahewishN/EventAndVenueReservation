import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { isAuthenticated } from "../utils/auth";

function AdminRoute() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    const verifyAdmin = async () => {
      if (!isAuthenticated()) {
        setStatus("unauthenticated");
        return;
      }

      try {
        const response = await axiosInstance.get("/api/users/me");

        if (!active) return;

        setStatus(
          response.data.role === "ADMIN" ? "authorized" : "forbidden"
        );
      } catch {
        if (active) {
          setStatus("unauthenticated");
        }
      }
    };

    verifyAdmin();

    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-600">Verifying administrator access...</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  if (status === "forbidden") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;