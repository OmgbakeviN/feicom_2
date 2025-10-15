import { Fragment } from "react";
import { Route, Routes } from "react-router-dom";
import { routes } from "./routes";
import AppLayout from "@/layouts/AppLayout";

export default function LayoutRoutes() {
  return (
    <Routes>
      {routes.map(({ path, Component }, i) => (
        <Fragment key={i}>
          <Route element={<AppLayout />}>
            <Route path={path} element={Component} />
          </Route>
        </Fragment>
      ))}
    </Routes>
  );
}
