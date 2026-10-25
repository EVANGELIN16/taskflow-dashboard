import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";

export default function ProtectedRoute() {
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function checkAuthentication() {
      try {
        const response = await fetch("http://localhost:5000/api/auth/me", {
          credentials: "include",
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setStatus(response.ok ? "authenticated" : "unauthenticated");
        }
      } catch {
        if (!controller.signal.aborted) {
          setStatus("unauthenticated");
        }
      }
    }

    void checkAuthentication();

    return () => controller.abort();
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
