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
          { title: "Départements", path: "/departements", type: "link", allowedRoles: ["NATIONAL"] },
          { title: "Agences", path: "/agences", type: "link", allowedRoles: ["NATIONAL"] },
          { title: "Communes", path: "/communes", type: "link" },
          { title: "Entreprises", path: "/entreprises", type: "link" },
          { title: "Lots", path: "/lots", type: "link" },
          { title: "Todos", path: "/todos", type: "link" },
          { title: "Exercise", path: "/exercise", type: "link" },
        ],
      },
    ],
  },
];
