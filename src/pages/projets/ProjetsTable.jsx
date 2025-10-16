import { useEffect, useMemo, useState, useCallback } from "react";
import DataTable from "react-data-table-component";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchProjets, createProjet, updateProjet, deleteProjet, deleteManyProjets,
  selectProjets, selectProjetsLoading, selectProjetsError
} from "@/features/crud/projetsSlice";
import { fetchExercices, selectExercices } from "@/features/crud/exercicesSlice";
import { fetchCommunes, selectCommunes } from "@/features/crud/communesSlice";
import { fetchEntreprises, selectEntreprises } from "@/features/crud/entreprisesSlice";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// utils
const fmtMoney = (n) => Number(n ?? 0).toLocaleString("fr-FR", { style: "currency", currency: "XAF" });
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString("fr-FR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" }) : "");
const toPct = (v) => {
  const n = parseFloat(v ?? 0);
  return Number.isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
};

// Barre % Tailwind
function PercentBar({ value, tone="zinc-900" }) {
  const pct = toPct(value);
  return (
    <div className="min-w-[90px]" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-200">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[length:8px_3px]" />
        <div className={`relative h-full rounded-full bg-${tone} transition-[width] duration-500`} style={{ width: `${pct}%` }}>
          <span className="absolute inset-0 grid place-items-center text-[10px] font-medium text-white/90">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

// --- Filtre Commune avec recherche (léger) ---
function CommuneSelect({ options = [], value = "", onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? options.filter(o => o.label.toLowerCase().includes(s)) : options;
  }, [q, options]);

  const label = useMemo(() => options.find(o => o.value === value)?.label ?? "-- Toutes les communes --", [options, value]);

  return (
    <div className="relative">
      <Button variant="outline" className="w-[320px] justify-between" onClick={()=>setOpen(v=>!v)}>
        <span className="truncate">{label}</span>
        <span className="text-zinc-400">▾</span>
      </Button>
      {open && (
        <div className="absolute z-10 mt-2 w-[320px] rounded-md border bg-white p-2 shadow-lg">
          <Input placeholder="Rechercher une commune…" value={q} onChange={(e)=>setQ(e.target.value)} className="mb-2" />
          <div className="max-h-64 overflow-y-auto">
            <Button variant={value===""?"default":"ghost"} className="w-full justify-start mb-1" onClick={()=>{ onChange(""); setOpen(false); setQ(""); }}>
              -- Toutes les communes --
            </Button>
            {filtered.length===0 ? (
              <div className="px-2 py-3 text-sm text-zinc-500">Aucun résultat…</div>
            ): filtered.map(opt=>(
              <Button key={opt.value} variant={value===opt.value?"default":"ghost"} className="w-full justify-start mb-1"
                onClick={()=>{ onChange(opt.value); setOpen(false); setQ(""); }}>
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Formulaire Projet (création/édition) ---
function ProjetForm({ initialData = {}, entreprises = [], communes = [], exercices = [], onSave, onCancel, loading }) {
  const [libelle, setLibelle] = useState(initialData.libelle || "");
  const [duree, setDuree] = useState(initialData.duree || "");
  const [montant_ht, setMontantHt] = useState(initialData.montant_ht || "");
  const [type, setType] = useState(initialData.type || "");
  const [numero_convention, setNumeroConvention] = useState(initialData.numero_convention || "");
  const [date_debut, setDateDebut] = useState(initialData.date_debut || "");
  const [date_fin, setDateFin] = useState(initialData.date_fin || "");
  const [entreprise, setEntreprise] = useState(typeof initialData.entreprise === "object" ? initialData.entreprise?.id : initialData.entreprise || "");
  const [commune, setCommune] = useState(typeof initialData.commune === "object" ? initialData.commune?.id : initialData.commune || "");
  const [exercice, setExercice] = useState(typeof initialData.exercice === "object" ? initialData.exercice?.id : initialData.exercice || "");

  const submit = (e) => {
    e.preventDefault();
    onSave({
      libelle, duree: Number(duree), montant_ht: Number(montant_ht), type, numero_convention,
      date_debut, date_fin,
      entreprise: Number(entreprise), commune: Number(commune), exercice: Number(exercice),
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label>Libellé</Label>
        <Input value={libelle} onChange={(e)=>setLibelle(e.target.value)} required />
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <div className="grid gap-2">
          <Label>Durée</Label>
          <Input type="number" value={duree} onChange={(e)=>setDuree(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label>Montant HT</Label>
          <Input type="number" value={montant_ht} onChange={(e)=>setMontantHt(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label>Type</Label>
          <select className="w-full rounded-md border px-3 py-2" value={type} onChange={(e)=>setType(e.target.value)} required>
            <option value="">Sélectionnez</option>
            <option value="INFRA">INFRA</option>
            <option value="ETUDE">ETUDE</option>
          </select>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Numéro de convention</Label>
          <Input value={numero_convention} onChange={(e)=>setNumeroConvention(e.target.value)} required />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Début</Label>
            <Input type="date" value={date_debut} onChange={(e)=>setDateDebut(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>Fin</Label>
            <Input type="date" value={date_fin} onChange={(e)=>setDateFin(e.target.value)} required />
          </div>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <div className="grid gap-2">
          <Label>Entreprise</Label>
          <select className="w-full rounded-md border px-3 py-2" value={entreprise} onChange={(e)=>setEntreprise(e.target.value)} required>
            <option value="">Sélectionnez</option>
            {entreprises.map(e => <option key={e.id} value={e.id}>{e.id} - {e.nom}</option>)}
          </select>
        </div>
        <div className="grid gap-2">
          <Label>Commune</Label>
          <select className="w-full rounded-md border px-3 py-2" value={commune} onChange={(e)=>setCommune(e.target.value)} required>
            <option value="">Sélectionnez</option>
            {communes.map(c => <option key={c.id} value={c.id}>{c.id} - {c.nom}</option>)}
          </select>
        </div>
        <div className="grid gap-2">
          <Label>Exercice</Label>
          <select className="w-full rounded-md border px-3 py-2" value={exercice} onChange={(e)=>setExercice(e.target.value)} required>
            <option value="">Sélectionnez</option>
            {exercices.map(x => <option key={x.id} value={x.id}>{x.id} - {x.annee}</option>)}
          </select>
        </div>
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : "Valider"}</Button>
      </DialogFooter>
    </form>
  );
}

export default function ProjectsTable() {
  const dispatch = useDispatch();

  const items = useSelector(selectProjets);
  const loading = useSelector(selectProjetsLoading);
  const error = useSelector(selectProjetsError);

  const exercices = useSelector(selectExercices);
  const communes = useSelector(selectCommunes);
  const entreprises = useSelector(selectEntreprises);

  // Filtres + recherche
  const [filters, setFilters] = useState({ exercice: "", commune: "" });
  const [searchText, setSearchText] = useState("");

  // Sélection / Dialog
  const [selectedRows, setSelectedRows] = useState([]);
  const [clearSelToggle, setClearSelToggle] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [node, setNode] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchProjets());
    dispatch(fetchExercices());
    dispatch(fetchCommunes());
    dispatch(fetchEntreprises());
  }, [dispatch]);

  // Par défaut → exercice année courante si présent
  useEffect(() => {
    if (!exercices.length || filters.exercice) return;
    const y = new Date().getFullYear();
    const m = exercices.find(e => Number(e.annee) === Number(y));
    if (m) setFilters(f => ({ ...f, exercice: m.id }));
  }, [exercices, filters.exercice]);

  // Build options pour CommuneSelect
  const communeOptions = useMemo(
    () => communes.map(c => ({ value: c.id, label: c.nom })),
    [communes]
  );

  // Filtrage (reprend la logique du fichier d’origine)
  const filtered = useMemo(() => {
    let out = Array.isArray(items) ? items : [];

    if (filters.exercice) {
      out = out.filter(r => (typeof r.exercice === "object" ? r.exercice?.id : r.exercice) === filters.exercice);
    }
    if (filters.commune !== "") {
      out = out.filter(r => (typeof r.commune === "object" ? r.commune?.id : r.commune) === filters.commune);
    }

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      out = out.filter(r => {
        const hay = [
          r.libelle, r.type, r.numero_convention, r.date_debut, r.date_fin, r.status, r.montant_ht,
          r.funding_purpose, r.approving_body, r.contract_ano_date, r.contract_amount, r.start_meeting_date,
          r.peo_ano_date, r.provisional_acceptance_date ?? "", r.final_acceptance_date ?? "",
          String(r.progress ?? ""), String(r.payment_percent ?? ""), String(r.time_consumed_percent ?? ""),
          r.entreprise?.nom ?? "", r.commune?.nom ?? "", r.commune?.departement?.nom ?? "",
          r.commune?.departement?.agence?.nom ?? "", String(r.exercice?.annee ?? ""), String(r.exercice?.budget ?? "")
        ].map(v => (v==null?"":String(v))).join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    return out;
  }, [items, filters, searchText]);

  // Actions CRUD → Dialogs
  const onAdd = () => {
    setTitle("Ajouter un projet");
    setNode(
      <ProjetForm
        entreprises={entreprises} communes={communes} exercices={exercices}
        onSave={async (payload)=>{ setBusy(true); try { await dispatch(createProjet(payload)).unwrap(); setOpen(false);} finally{ setBusy(false);} }}
        onCancel={()=>setOpen(false)} loading={busy}
      />
    );
    setOpen(true);
  };

  const onEdit = (row) => {
    setTitle("Modifier le projet");
    setNode(
      <ProjetForm
        initialData={row} entreprises={entreprises} communes={communes} exercices={exercices}
        onSave={async (payload)=>{ setBusy(true); try { await dispatch(updateProjet({ id: row.id, data: payload })).unwrap(); setOpen(false);} finally{ setBusy(false);} }}
        onCancel={()=>setOpen(false)} loading={busy}
      />
    );
    setOpen(true);
  };

  const onDeleteOne = (row) => {
    setTitle("Supprimer le projet");
    setNode(
      <div>
        <p>Voulez-vous vraiment supprimer <b>{row.libelle}</b> ?</p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={()=>setOpen(false)} disabled={busy}>Annuler</Button>
          <Button variant="destructive" onClick={async()=>{ setBusy(true); try{ await dispatch(deleteProjet(row.id)).unwrap(); setOpen(false);} finally{ setBusy(false);} }}>
            Supprimer
          </Button>
        </DialogFooter>
      </div>
    );
    setOpen(true);
  };

  const onDeleteMany = () => {
    const ids = selectedRows.map(r=>r.id);
    const noms = selectedRows.map(r=>r.libelle);
    setTitle("Supprimer la sélection");
    setNode(
      <div>
        <p>Supprimer ces projets ?<br/><b>{noms.join(", ")}</b></p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={()=>setOpen(false)} disabled={busy}>Annuler</Button>
          <Button variant="destructive" onClick={async()=>{ setBusy(true); try{ await dispatch(deleteManyProjets(ids)).unwrap(); setClearSelToggle(v=>!v); setOpen(false);} finally{ setBusy(false);} }}>
            Supprimer
          </Button>
        </DialogFooter>
      </div>
    );
    setOpen(true);
  };

  // Colonnes (identiques au fichier original)
  const columns = [
    { name: "Libellé", selector: r => r.libelle, sortable: true, wrap: true, minWidth: "300px", grow: 2 },
    { name: "Durée", selector: r => r.duree, sortable: true, width: "100px", center: true },
    { name: "Montant HT", selector: r => r.montant_ht, sortable: true, width: "150px", cell: r => fmtMoney(r.montant_ht) },
    { name: "Date début", selector: r => r.date_debut, sortable: true, cell: r => fmtDate(r.date_debut) },
    { name: "Date fin", selector: r => r.date_fin, sortable: true, cell: r => fmtDate(r.date_fin) },
    { name: "Agence", selector: r => r?.commune?.departement?.agence?.nom, sortable: true },
    { name: "Entreprise", selector: r => r?.entreprise?.nom, sortable: true },
    { name: "Financement", selector: r => r.payment_percent, sortable: true, cell: r => <PercentBar value={r.payment_percent} tone="zinc-900" /> },
    { name: "Avancement", selector: r => r.progress, sortable: true, cell: r => <PercentBar value={r.progress} tone="zinc-500" /> },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={()=>onEdit(row)}>Modifier</Button>
          <Button size="sm" variant="destructive" onClick={()=>onDeleteOne(row)}>Supprimer</Button>
        </div>
      ),
      button: true, ignoreRowClick: true, width: "200px",
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Gestion des Projets</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {/* Exercice */}
            <select
              className="rounded-md border px-3 py-2"
              value={filters.exercice}
              onChange={(e)=>setFilters(f=>({ ...f, exercice: e.target.value ? Number(e.target.value) : "" }))}
            >
              <option value="">-- Tous les exercices --</option>
              {exercices.map(x => <option key={x.id} value={x.id}>{x.annee}</option>)}
            </select>

            {/* Commune avec recherche */}
            <CommuneSelect
              options={communeOptions}
              value={filters.commune}
              onChange={(v)=>setFilters(f=>({ ...f, commune: v === "" ? "" : Number(v) }))}
            />

            {/* Recherche globale */}
            <Input placeholder="Recherche…" className="w-64" value={searchText} onChange={(e)=>setSearchText(e.target.value)} />

            <Button onClick={onAdd}>Ajouter</Button>
          </div>
        </CardHeader>

        <CardContent>
          {error && <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{String(error)}</div>}

          {selectedRows.length>0 && (
            <div className="mb-3 flex items-center justify-between rounded-md border bg-zinc-50 p-3">
              <div className="text-sm text-zinc-600">Supprimer la sélection ({selectedRows.length})</div>
              <Button variant="destructive" onClick={onDeleteMany}>Supprimer</Button>
            </div>
          )}

          <DataTable
            data={filtered}
            columns={columns}
            pagination
            striped
            selectableRows
            onSelectedRowsChange={(s)=>setSelectedRows(s.selectedRows)}
            clearSelectedRows={clearSelToggle}
            progressPending={loading}
            noDataComponent="Aucune donnée"
            dense
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
          <div className="pt-2">{node}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
