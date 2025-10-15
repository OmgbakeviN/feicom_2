import { Suspense } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";
import LayoutRoutes from "./LayoutRoutes";
import Login from "@/pages/Login";
import Unauthorized from "@/pages/Unauthorized";

function Loader() {
  return <div className="p-6">Chargement…</div>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* privées */}
          <Route element={<PrivateRoute />}>
            {/* redirection post-login */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* branches par rôle si besoin */}
            <Route element={<RoleRoute allowed={['REGIONAL']} />}>
              <Route path="/dashboard/regional/*" element={<LayoutRoutes />} />
            </Route>

            <Route element={<RoleRoute allowed={['NATIONAL']} />}>
              <Route path="/dashboard/national/*" element={<LayoutRoutes />} />
            </Route>

            {/* reste de l'app protégée */}
            <Route path="/*" element={<LayoutRoutes />} />
          </Route>

          {/* fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
