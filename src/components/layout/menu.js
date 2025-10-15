export const MENUITEMS = [
  {
    menutitle: "General",
    items: [
      { title: "Dashboard", path: "/dashboard", type: "link", icon: "home" },
      {
        title: "Projects",
        type: "sub",
        icon: "project",
        children: [
          { title: "Grid View", path: "/projects/grid", type: "link" },
          { title: "Table View", path: "/feicom/projets", type: "link" },
        ],
      },
      { title: "Visit Reports", path: "/feicom/visites", type: "link" },
    ],
  },
  {
    menutitle: "Administration",
    items: [
      {
        title: "CRUD Operations",
        type: "sub",
        icon: "settings",
        children: [
          { title: "Départements", path: "/feicom/departements", type: "link", allowedRoles: ["NATIONAL"] },
          { title: "Agences", path: "/feicom/agences", type: "link", allowedRoles: ["NATIONAL"] },
          { title: "Communes", path: "/feicom/communes", type: "link" },
          { title: "Entreprises", path: "/feicom/entreprises", type: "link" },
          { title: "Lots", path: "/feicom/lots", type: "link" },
          { title: "Todos", path: "/feicom/todos", type: "link" },
          { title: "Exercise", path: "/feicom/exercise", type: "link" },
        ],
      },
    ],
  },
];
