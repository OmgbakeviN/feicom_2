import Dashboard from "@/pages/Dashboard.jsx";
import Projects from "@/pages/Projects.jsx";
import AgencesTable from "@/pages/agences/AgencesTable.jsx";
import CommunesTable from "@/pages/communes/CommunesTable.jsx";
import DepartementsTable from "@/pages/departements/DepartementsTable.jsx";
import EntreprisesTable from "@/pages/entreprises/EntreprisesTable.jsx";
import ExercicesTable from "@/pages/exercices/ExercicesTable.jsx";
import LotsTable from "@/pages/lots/LotsTable.jsx";
import TodosTable from "@/pages/todos/TodosTable.jsx";
import VisitesTable from "@/pages/visites/VisitesTable.jsx";
import ProjetsTable from "@/pages/projets/ProjetsTable.jsx";

export const routes = [
  { path: "/dashboard", Component: <Dashboard /> },
  { path: "/projects", Component: <Projects /> },
  { path: "/agences", Component: <AgencesTable /> },
  { path: "/communes", Component: <CommunesTable /> },
  { path: "/departements", Component: <DepartementsTable /> },
  { path: "/entreprises", Component: <EntreprisesTable /> },
  { path: "/exercices", Component: <ExercicesTable /> },
  { path: "/lots", Component: <LotsTable /> },
  { path: "/todos", Component: <TodosTable /> },
  { path: "/visites", Component: <VisitesTable /> },
  { path: "/projets-table", Component: <ProjetsTable /> },
];
