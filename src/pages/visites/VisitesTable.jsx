import { useEffect, useMemo, useState, useCallback } from "react";
import DataTable from "react-data-table-component";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchVisites, createVisite, updateVisite, deleteVisite, deleteManyVisites,
  selectVisites, selectVisitesLoading, selectVisitesError
} from "@/features/crud/visitesSlice";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const fmtDateISO = (s) => (s ? String(s).split("T")[0] : "");
const toPct = (v) => {
  const n = parseFloat(v ?? 0);
  return Number.isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
};

// Barre 100% HTML/Tailwind (comme Exercices)
function PercentBar({ value }) {
  const pct = toPct(value);
  return (
    <div className="min-w-[160px]" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-200">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[length:8px_3px]" />
        <div className="relative h-full rounded-full bg-zinc-900 transition-[width] duration-500" style={{ width: `${pct}%` }}>
          <span className="absolute inset-0 grid place-items-center text-[10px] font-medium text-white/90">
            {pct}%
          </span>
        </div>
      </div>
      {/* <div className="mt-1 text-center text-[11px] text-zinc-600">{pct}%</div> */}
    </div>
  );
}

// helpers pour extraire les noms (depuis l'objet visite)
const agenceName = (v) => v?.projet?.commune?.departement?.agence?.nom ?? "—";
const communeName = (v) => v?.projet?.commune?.nom ?? "—";
const projetName  = (v) => v?.projet?.libelle ?? "—";

// Formulaire minimal (création/édition)
function VisiteForm({ initialData = {}, onSave, onCancel, loading }) {
  const [date, setDate] = useState(initialData.date || "");
  const [projetId, setProjetId] = useState(initialData?.projet?.id || initialData.projet || "");
  const [observation, setObservation] = useState(initialData.observation || "");
  const [paymentPercent, setPaymentPercent] = useState(initialData.payment_percent ?? "");

  useEffect(() => {
    setDate(initialData.date || "");
    setProjetId(initialData?.projet?.id || initialData.projet || "");
    setObservation(initialData.observation || "");
    setPaymentPercent(initialData.payment_percent ?? "");
  }, [initialData?.id]);

  const submit = (e) => {
    e.preventDefault();
    onSave({
      date: date || undefined,
      projet: projetId ? Number(projetId) : undefined, // l’API attend probablement un id de projet
      observation,
      payment_percent: paymentPercent === "" ? undefined : Number(paymentPercent),
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="projet">ID Projet</Label>
          <Input id="projet" type="number" value={projetId ?? ""} onChange={(e)=>setProjetId(e.target.value)} placeholder="ex: 1" />
          {/* On pourra remplacer par un select de projets quand l’endpoint sera branché */}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="observation">Observation</Label>
        <Textarea id="observation" value={observation} onChange={(e)=>setObservation(e.target.value)} rows={4} />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="pay">Paiement (%)</Label>
          <Input id="pay" type="number" step="0.01" value={paymentPercent} onChange={(e)=>setPaymentPercent(e.target.value)} />
        </div>
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : "Valider"}</Button>
      </DialogFooter>
    </form>
  );
}

function DeleteConfirm({ names = [], onConfirm, onCancel, loading }) {
  return (
    <div className="space-y-4">
      <p>Voulez-vous vraiment supprimer {names.length>1 ? "les visites suivantes" : "la visite suivante"} ?</p>
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

export default function VisitesTable() {
  const dispatch = useDispatch();
  const items = useSelector(selectVisites);
  const loading = useSelector(selectVisitesLoading);
  const error = useSelector(selectVisitesError);

  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [clearSelToggle, setClearSelToggle] = useState(false);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [node, setNode] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(()=>{ dispatch(fetchVisites()); }, [dispatch]);

  // filtre par agence/commune/projet/obs
  const filtered = useMemo(()=>{
    const q = search.trim().toLowerCase();
    if(!q) return items;
    const f = (v)=> (v ?? "").toString().toLowerCase().includes(q);
    return items.filter(v =>
      f(agenceName(v)) || f(communeName(v)) || f(projetName(v)) || f(v.observation) || f(v.date)
    );
  }, [items, search]);

  const onSelect = useCallback((state)=> setSelectedRows(state.selectedRows), []);

  // Actions → Dialogs
  const onAdd = () => {
    setTitle("Ajouter une Visite");
    setNode(
      <VisiteForm
        onSave={async (form)=>{ setBusy(true); try { await dispatch(createVisite(form)).unwrap(); setOpen(false); } finally { setBusy(false); } }}
        onCancel={()=>setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onEdit = (row) => {
    setTitle("Modifier la Visite");
    setNode(
      <VisiteForm
        initialData={row}
        onSave={async (form)=>{ setBusy(true); try { await dispatch(updateVisite({ id: row.id, data: form })).unwrap(); setOpen(false); } finally { setBusy(false); } }}
        onCancel={()=>setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onDeleteOne = (row) => {
    setTitle("Supprimer la Visite");
    setNode(
      <DeleteConfirm
        names={[`${fmtDateISO(row.date)} • ${projetName(row)}`]}
        onConfirm={async ()=>{ setBusy(true); try { await dispatch(deleteVisite(row.id)).unwrap(); setOpen(false); } finally { setBusy(false); } }}
        onCancel={()=>setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onDeleteMany = () => {
    const ids = selectedRows.map(r=>r.id);
    const names = selectedRows.map(r=> `${fmtDateISO(r.date)} • ${projetName(r)}`);
    setTitle("Supprimer la sélection");
    setNode(
      <DeleteConfirm
        names={names}
        onConfirm={async ()=>{ setBusy(true); try { await dispatch(deleteManyVisites(ids)).unwrap(); setClearSelToggle(v=>!v); setOpen(false); } finally { setBusy(false); } }}
        onCancel={()=>setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  // Colonnes demandées : Agence, Commune, Projet, Observation, Payment %
  const columns = [
    { name: "Date", selector: r => fmtDateISO(r.date), sortable: true, width: "120px" },
    { name: "Agence", selector: r => agenceName(r), sortable: true, wrap: true },
    { name: "Commune", selector: r => communeName(r), sortable: true, wrap: true },
    { name: "Projet", selector: r => projetName(r), sortable: true, wrap: true },
    {
      name: "Paiement %",
      cell: r => <PercentBar value={r.payment_percent} />,
      sortable: false, width: "200px",
    },
    { name: "Observation", selector: r => r.observation ?? "—", sortable: false, wrap: true, grow: 2 },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={()=>onEdit(row)}>Modifier</Button>
          <Button size="sm" variant="destructive" onClick={()=>onDeleteOne(row)}>Supprimer</Button>
        </div>
      ),
      button: true, ignoreRowClick: true, width: "240px",
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestion des Visites</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Recherche (agence / commune / projet / obs)" className="w-96"
              onChange={(e)=>setSearch(e.target.value)} />
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
