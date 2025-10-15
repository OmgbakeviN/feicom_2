import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function PrivateRoute() {
  const { user, token } = useSelector((s) => s.auth);
  const lsToken = localStorage.getItem("token");
  const lsUser = localStorage.getItem("user");

  const isAuth = (user && token) || (lsToken && lsUser);
  if (!isAuth) return <Navigate to="/login" replace />;
  return <Outlet />;
}
