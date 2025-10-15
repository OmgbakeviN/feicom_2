import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function RoleRoute({ allowed = [] }) {
  const { user } = useSelector((s) => s.auth);
  const localUser = user ?? JSON.parse(localStorage.getItem("user") || "null");
  const role = localUser?.role;

  if (!role) return <Navigate to="/login" replace />;
  if (!allowed.includes(role)) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}
