import { useState, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { MENUITEMS } from "./menu";
import { useSelector } from "react-redux";
import { ChevronDown, ChevronRight } from "lucide-react";

function ItemLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        "block rounded-md px-3 py-2 text-sm transition " +
        (isActive ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100")
      }
    >
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const role = useSelector(s => s.auth.user?.role);
  const [open, setOpen] = useState({});
  const { pathname } = useLocation();

  const filtered = useMemo(() => {
    return MENUITEMS.map(sec => ({
      ...sec,
      items: sec.items
        .map(i => {
          if (i.type === "sub") {
            const children = (i.children || []).filter(c => !c.allowedRoles || c.allowedRoles.includes(role));
            return { ...i, children };
          }
          if (i.allowedRoles && !i.allowedRoles.includes(role)) return null;
          return i;
        })
        .filter(Boolean),
    }));
  }, [role]);

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-56px)] w-64 shrink-0 border-r bg-white p-3 md:block">
      <nav className="space-y-6">
        {filtered.map((section, si) => (
          <div key={si} className="space-y-2">
            <div className="px-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">{section.menutitle}</div>
            <div className="space-y-1">
              {section.items.map((item, ii) =>
                item.type === "link" ? (
                  <ItemLink key={ii} to={item.path} label={item.title} />
                ) : (
                  <div key={ii}>
                    <button
                      onClick={() => setOpen(o => ({ ...o, [item.title]: !o[item.title] }))}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                    >
                      <span>{item.title}</span>
                      {open[item.title] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    {open[item.title] && (
                      <div className="mt-1 space-y-1 pl-2">
                        {item.children?.map((c, ci) => (
                          <ItemLink key={ci} to={c.path} label={c.title} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-6 px-3 text-[11px] text-zinc-400 break-words">{pathname}</div>
    </aside>
  );
}
