import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import ProjectFilters from "./grid/ProjectFilters";
import ProjectCard from "./grid/ProjectCard";
import { Card, CardContent } from "@/components/ui/card";

import { fetchProjets, selectProjets } from "@/features/crud/projetsSlice";
import { fetchExercices, selectExercices } from "@/features/crud/exercicesSlice";
import { fetchCommunes, selectCommunes } from "@/features/crud/communesSlice";
import { fetchAgences, selectAgences } from "@/features/crud/agencesSlice";

import {
  fetchProjectsByFilters,
  setFilters,
  resetFilters,
  selectGridFilters,
  selectGridLoading,
  selectGridError,
  selectGridServerItems,
  selectGridFromServer,
} from "@/features/projectsGrid/projectsGridSlice";

export default function ProjectsGrid() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- USER depuis Redux (fallback localStorage plus bas)
  const userFromStore = useSelector((s) => s.auth?.user || s.auth?.currentUser || s.auth?.profile || null);

  // --- USER depuis localStorage (shape: { username, role, agence, agence_id, ... })
  let userLocal = null;
  try {
    userLocal = JSON.parse(localStorage.getItem("user") || "null");
  } catch (_) {
    userLocal = null;
  }

  // Rôle & Agence (texte + id) résolus de façon robuste
  const role = userFromStore?.role || userLocal?.role || undefined;
  const agenceName = userFromStore?.agence || userLocal?.agence || undefined;     // "Littoral" etc. (affichage)
  const agenceIdFromAuth = userFromStore?.agence_id ?? userLocal?.agence_id ?? undefined; // <-- ID numérique pour REGIONAL

  // Référentiels
  const projetsAll = useSelector(selectProjets) || [];
  const exercices  = useSelector(selectExercices) || [];
  const communes   = useSelector(selectCommunes) || [];
  const agences    = useSelector(selectAgences) || [];

  // Grid slice
  const filters     = useSelector(selectGridFilters);
  const loading     = useSelector(selectGridLoading);
  const error       = useSelector(selectGridError);
  const serverItems = useSelector(selectGridServerItems) || [];
  const fromServer  = useSelector(selectGridFromServer);

  // 1) Charger référentiels uniquement si absents
  useEffect(() => {
    if (projetsAll.length === 0) dispatch(fetchProjets());
    if (exercices.length === 0)  dispatch(fetchExercices());
    if (communes.length === 0)   dispatch(fetchCommunes());
    if (role === "NATIONAL" && agences.length === 0) dispatch(fetchAgences());
  }, [dispatch, role, projetsAll.length, exercices.length, communes.length, agences.length]);

  // 2) Initialiser filtres: agence forcée en REGIONAL + exercice courant si possible
  useEffect(() => {
    const patch = {};
    if (role === "REGIONAL" && Number.isFinite(Number(agenceIdFromAuth)) && !filters.agence) {
      patch.agence = Number(agenceIdFromAuth);
    }
    if (!filters.exercice && exercices.length > 0) {
      const current = exercices.find((e) => Number(e.annee) === new Date().getFullYear());
      if (current) patch.exercice = current.id;
    }
    if (Object.keys(patch).length > 0) dispatch(setFilters(patch));
  }, [dispatch, role, agenceIdFromAuth, filters.agence, filters.exercice, exercices]);

  // 3) Appel /filters/... automatique quand exercice/agence/mois changent (guards stricts)
  useEffect(() => {
    const exId = Number.parseInt(filters.exercice, 10);
    const agId = role === "NATIONAL"
      ? Number.parseInt(filters.agence, 10)
      : Number.parseInt(agenceIdFromAuth, 10);

    // ne rien faire tant qu'on n'a pas deux entiers valides
    if (!Number.isFinite(exId) || !Number.isFinite(agId)) return;

    // attendre un minimum de référentiels pour éviter les flashs
    if (exercices.length === 0 || communes.length === 0) return;

    const m = Number.isFinite(Number(filters.month)) ? Number(filters.month) : "";
    dispatch(fetchProjectsByFilters({ exerciceId: exId, agenceId: agId, month: m }));
  }, [dispatch, role, agenceIdFromAuth, filters.exercice, filters.agence, filters.month, exercices.length, communes.length]);

  // 4) Source data : réponse serveur si dispo, sinon projets du store
  const baseData = fromServer ? serverItems : projetsAll;

  // 5) Filtres locaux (communes multi & recherche)
  const displayed = useMemo(() => {
    let out = baseData;

    const communeIds = new Set((filters.communes || []).map(Number));
    if (communeIds.size > 0) {
      out = out.filter((p) => {
        const id = p?.commune ? (typeof p.commune === "object" ? p.commune.id : p.commune) : null;
        return id != null && communeIds.has(Number(id));
      });
    }

    const q = (filters.search || "").trim().toLowerCase();
    if (q) {
      out = out.filter((p) => {
        const hay = [
          p.libelle,
          p?.entreprise?.nom,
          p?.commune?.nom,
          p?.commune?.departement?.agence?.nom,
          p.numero_convention,
          p.type,
          p.date_debut,
          p.date_fin,
          String(p.montant_ht ?? ""),
        ].map((v) => (v == null ? "" : String(v))).join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    return out;
  }, [baseData, filters.communes, filters.search]);

  const onChange = (name, value) => dispatch(setFilters({ [name]: value }));
  // on reset nous permet de recuperer les projet et reinitialiser les filtres
  const onReset = () => {
    dispatch(resetFilters(role === "REGIONAL" ? Number(agenceIdFromAuth || 0) : ""));
    // Force la grille à repasser sur la source locale (fromServer=false)
    dispatch(fetchProjectsByFilters({ exerciceId: null, agenceId: null, month: "" }));
    // Re-fetch la liste de base depuis projetsSlice
    dispatch(fetchProjets());
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <ProjectFilters
            role={role}
            agenceUserId={agenceName || (Number.isFinite(Number(agenceIdFromAuth)) ? `#${agenceIdFromAuth}` : "")}
            exercices={exercices}
            agences={agences}
            communes={communes}
            values={filters}
            onChange={onChange}
            onReset={onReset}
            loading={loading}
            /** onApply supprimé : fetch auto via useEffect */
          />
        </CardContent>
      </Card>

      {/* ⚠️ n'afficher l'erreur que si elle provient d'un vrai appel /filters */}
      {fromServer && error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {String(error)}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        {displayed.map((p) => (
          <ProjectCard key={p.id} p={p} onClick={() => navigate(`/feicom/projets/${p.id}/detail`)} />
        ))}
      </div>

      {loading && <div className="text-center text-sm text-zinc-500">Chargement…</div>}
      {!loading && displayed.length === 0 && <div className="text-center text-sm text-zinc-500">Aucun projet.</div>}
    </div>
  );
}
