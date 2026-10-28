
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function ProtectedRoute() {
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function checkAuthentication() {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setStatus(
            response.ok ? "authenticated" : "unauthenticated"
          );
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Authentication check failed:", error);
          setStatus("unauthenticated");
        }
      }
    }

    void checkAuthentication();

    return () => {
      controller.abort();
    };
  }, []);

  if (status === "loading") {
    return (
      <div role="status" className="p-8 text-center">
        Checking authentication...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout />;
}
