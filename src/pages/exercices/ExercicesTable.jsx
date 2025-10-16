import { useEffect, useMemo, useState, useCallback } from "react";
import DataTable from "react-data-table-component";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchExercices, createExercice, updateExercice,
  deleteExercice, deleteManyExercices,
  selectExercices, selectExercicesLoading, selectExercicesError
} from "@/features/crud/exercicesSlice";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// utils
const fmtDate = (s) => (s ? String(s).split("T")[0] : "");
const toPct = (v) => {
  const n = parseFloat(v ?? 0);
  return isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
};
const fmtMoney = (v) => {
  if (v == null) return "";
  try { return Number(v).toLocaleString("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }); }
  catch { return v; }
};

// Barre de progression 100% HTML + Tailwind (accessibilité incluse)
function PercentBar({ value }) {
  const pct = toPct(value);

  return (
    <div
      className="min-w-[160px]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label="progression"
      title={`${pct}%`}
    >
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-200">
        {/* fond hachuré léger */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[length:8px_3px]" />
        {/* remplissage */}
        <div
          className="relative h-full rounded-full bg-zinc-900 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        >
          {/* texte dans la barre */}
          <span className="absolute inset-0 grid place-items-center text-[10px] font-medium text-white/90">
            {pct}%
          </span>
        </div>
      </div>
      {/* texte sous la barre (meilleure lisibilité) */}
      {/* <div className="mt-1 text-center text-[11px] text-zinc-600">{pct}%</div> */}
    </div>
  );
}

// Formulaire (ajout/édition)
function ExerciceForm({ initialData = {}, onSave, onCancel, loading }) {
  const [budget, setBudget] = useState(initialData.budget || "");
  const [annee, setAnnee] = useState(initialData.annee || "");
  const [taux, setTaux] = useState(initialData.taux_consomme || "");
  const [pct, setPct] = useState(initialData.pourcentage_consomme || "");

  useEffect(() => {
    setBudget(initialData.budget || "");
    setAnnee(initialData.annee || "");
    setTaux(initialData.taux_consomme || "");
    setPct(initialData.pourcentage_consomme || "");
  }, [initialData?.id]);

  const submit = (e) => {
    e.preventDefault();
    onSave({
      budget,
      annee: Number(annee),
      taux_consomme: String(taux),
      pourcentage_consomme: String(pct),
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="annee">Année</Label>
          <Input id="annee" type="number" value={annee} onChange={(e)=>setAnnee(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="budget">Budget (XAF)</Label>
          <Input id="budget" type="number" step="0.01" value={budget} onChange={(e)=>setBudget(e.target.value)} required />
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="taux">Taux consommé (%)</Label>
          <Input id="taux" type="number" step="0.01" value={taux} onChange={(e)=>setTaux(e.target.value)} placeholder="ex: 27.8" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pct">Pourcentage consommé (%)</Label>
          <Input id="pct" type="number" step="0.01" value={pct} onChange={(e)=>setPct(e.target.value)} placeholder="ex: 27.8" />
        </div>
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : "Valider"}</Button>
      </DialogFooter>
    </form>
  );
}

// Confirmation suppression
function DeleteConfirm({ names = [], onConfirm, onCancel, loading }) {
  return (
    <div className="space-y-4">
      <p>Voulez-vous vraiment supprimer {names.length>1 ? "les exercices suivants" : "l’exercice suivant"} ?</p>
      <p className="text-sm"><b>{names.join(", ")}</b></p>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button variant="destructive" onClick={onConfirm} disabled={loading}>
          {loading ? "Suppression..." : "Supprimer"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function ExercicesTable() {
  const dispatch = useDispatch();
  const items = useSelector(selectExercices);
  const loading = useSelector(selectExercicesLoading);
  const error = useSelector(selectExercicesError);

  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [clearSelToggle, setClearSelToggle] = useState(false);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [node, setNode] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(()=>{ dispatch(fetchExercices()); }, [dispatch]);

  const filtered = useMemo(()=>{
    const q = search.trim().toLowerCase();
    if(!q) return items;
    const f = (v)=> (v ?? "").toString().toLowerCase().includes(q);
    return items.filter(r =>
      f(r.annee) || f(r.budget) || f(r.taux_consomme) || f(r.pourcentage_consomme)
    );
  }, [items, search]);

  const onSelect = useCallback((state)=> setSelectedRows(state.selectedRows), []);

  // Actions → Dialogs
  const onAdd = () => {
    setTitle("Ajouter un Exercice");
    setNode(
      <ExerciceForm
        onSave={async (form)=>{
          setBusy(true);
          try { await dispatch(createExercice(form)).unwrap(); setOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={()=>setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onEdit = (row) => {
    setTitle("Modifier l’Exercice");
    setNode(
      <ExerciceForm
        initialData={row}
        onSave={async (form)=>{
          setBusy(true);
          try { await dispatch(updateExercice({ id: row.id, data: form })).unwrap(); setOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={()=>setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onDeleteOne = (row) => {
    setTitle("Supprimer l’Exercice");
    setNode(
      <DeleteConfirm
        names={[`${row.annee} (${fmtMoney(row.budget)})`]}
        onConfirm={async ()=>{
          setBusy(true);
          try { await dispatch(deleteExercice(row.id)).unwrap(); setOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={()=>setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onDeleteMany = () => {
    const ids = selectedRows.map(r => r.id);
    const names = selectedRows.map(r => `${r.annee} (${fmtMoney(r.budget)})`);
    setTitle("Supprimer la sélection");
    setNode(
      <DeleteConfirm
        names={names}
        onConfirm={async ()=>{
          setBusy(true);
          try {
            await dispatch(deleteManyExercices(ids)).unwrap();
            setClearSelToggle(v=>!v);
            setOpen(false);
          } finally { setBusy(false); }
        }}
        onCancel={()=>setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  // Colonnes (toutes infos) + Progress bars
  const columns = [
    { name: "Année", selector: r => r.annee, sortable: true, width: "100px" },
    { name: "Budget", selector: r => fmtMoney(r.budget), sortable: true, wrap: true },
    {
      name: "Taux consommé",
      cell: r => <PercentBar value={r.taux_consomme} />,
      sortable: false,
      width: "200px",
    },
    {
      name: "Pourcentage consommé",
      cell: r => <PercentBar value={r.pourcentage_consomme} />,
      sortable: false,
      width: "220px",
    },
    { name: "Créé le", selector: r => fmtDate(r.created_at), sortable: true, width: "120px" },
    { name: "MAJ le", selector: r => fmtDate(r.updated_at), sortable: true, width: "120px" },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={()=>onEdit(row)}>Modifier</Button>
          <Button size="sm" variant="destructive" onClick={()=>onDeleteOne(row)}>Supprimer</Button>
        </div>
      ),
      button: true,
      ignoreRowClick: true,
      width: "240px",
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestion des Exercices</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Recherche" className="w-64" onChange={(e)=>setSearch(e.target.value)} />
            <Button onClick={onAdd}>Ajouter</Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {String(error)}
            </div>
          )}

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
            selectableRows
            onSelectedRowsChange={onSelect}
            clearSelectedRows={clearSelToggle}
            progressPending={loading}
            noDataComponent="Aucune donnée"
            striped
            dense
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
          <div className="pt-2">{node}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
