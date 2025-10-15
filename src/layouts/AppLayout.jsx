import { Outlet, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "@/features/auth/authSlice";

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <Link to="/dashboard" className="font-semibold">Project Manager</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/dashboard" className="hover:underline">Dashboard</Link>
            <Link to="/projects" className="hover:underline">Projects</Link>
            <button
              onClick={() => { dispatch(logout()); navigate("/login"); }}
              className="rounded-md border px-3 py-1.5 hover:bg-gray-100"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
