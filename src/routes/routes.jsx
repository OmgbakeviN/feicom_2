import Dashboard from "@/pages/Dashboard.jsx";
import Projects from "@/pages/Projects.jsx";
import AgencesTable from "@/pages/agences/AgencesTable.jsx";
import CommunesTable from "@/pages/communes/CommunesTable.jsx";
import DepartementsTable from "@/pages/departements/DepartementsTable.jsx";
import EntreprisesTable from "@/pages/entreprises/EntreprisesTable.jsx";

export const routes = [
  { path: "/dashboard", Component: <Dashboard /> },
  { path: "/projects", Component: <Projects /> },
  { path: "/agences", Component: <AgencesTable /> },
  { path: "/communes", Component: <CommunesTable /> },
  { path: "/departements", Component: <DepartementsTable /> },
  { path: "/entreprises", Component: <EntreprisesTable /> },
];
