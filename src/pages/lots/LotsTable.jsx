import { useEffect, useMemo, useState, useCallback } from "react";
import DataTable from "react-data-table-component";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLots, createLot, updateLot, deleteLot, deleteManyLots,
  selectLots, selectLotsLoading, selectLotsError
} from "@/features/crud/lotsSlice";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// utilitaires
const fmtDate = (s) => (s ? String(s).split("T")[0] : "");
const fmtMoney = (v) => {
  if (v == null) return "";
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }) : String(v);
};
const STATUTS = ["NOT STARTED", "STARTED", "IN PROGRESS", "PAUSED", "DONE"]; // ajuste si besoin

// --- Formulaire Lot (ajout / édition) ---
function LotForm({ initialData = {}, onSave, onCancel, loading }) {
  const [nom, setNom] = useState(initialData.nom || "");
  const [statut, setStatut] = useState(initialData.statut || "NOT STARTED");
  const [montant, setMontant] = useState(initialData.montant || "");
  const [pourcentage, setPourcentage] = useState(initialData.pourcentage || "");
  const [projet, setProjet] = useState(initialData.projet || ""); // ici on saisit l'ID du projet (int)

  useEffect(() => {
    setNom(initialData.nom || "");
    setStatut(initialData.statut || "NOT STARTED");
    setMontant(initialData.montant || "");
    setPourcentage(initialData.pourcentage || "");
    setProjet(initialData.projet || "");
  }, [initialData?.id]);

  const submit = (e) => {
    e.preventDefault();
    onSave({
      nom,
      statut,
      montant: String(montant),
      pourcentage: String(pourcentage),
      projet: projet ? Number(projet) : null,
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="nom">Nom du lot</Label>
        <Input id="nom" value={nom} onChange={(e)=>setNom(e.target.value)} required />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="statut">Statut</Label>
          <select
            id="statut"
            className="w-full rounded-md border px-3 py-2"
            value={statut}
            onChange={(e)=>setStatut(e.target.value)}
          >
            {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="projet">ID Projet</Label>
          <Input id="projet" type="number" value={projet ?? ""} onChange={(e)=>setProjet(e.target.value)} placeholder="ex: 1" />
          {/* Si tu veux, on pourra remplacer par un select de projets quand l'endpoint sera dispo */}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="montant">Montant (XAF)</Label>
          <Input id="montant" type="number" step="0.01" value={montant} onChange={(e)=>setMontant(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pourcentage">Pourcentage (%)</Label>
          <Input id="pourcentage" type="number" step="0.01" value={pourcentage} onChange={(e)=>setPourcentage(e.target.value)} />
        </div>
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : "Valider"}</Button>
      </DialogFooter>
    </form>
  );
}

// --- Confirmation suppression ---
function DeleteConfirm({ names = [], onConfirm, onCancel, loading }) {
  return (
    <div className="space-y-4">
      <p>Voulez-vous vraiment supprimer {names.length > 1 ? "les lots suivants" : "le lot suivant"} ?</p>
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

export default function LotsTable() {
  const dispatch = useDispatch();
  const items = useSelector(selectLots);
  const loading = useSelector(selectLotsLoading);
  const error = useSelector(selectLotsError);

  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [clearSelToggle, setClearSelToggle] = useState(false);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [node, setNode] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(()=>{ dispatch(fetchLots()); }, [dispatch]);

  const filtered = useMemo(()=>{
    const q = search.trim().toLowerCase();
    if (!q) return items;
    const f = (v) => (v ?? "").toString().toLowerCase().includes(q);
    return items.filter(r =>
      f(r.nom) || f(r.statut) || f(r.montant) || f(r.pourcentage) || f(r.projet)
    );
  }, [items, search]);

  const onSelect = useCallback((state) => setSelectedRows(state.selectedRows), []);

  // Actions → Dialogs
  const onAdd = () => {
    setTitle("Ajouter un Lot");
    setNode(
      <LotForm
        onSave={async (form) => {
          setBusy(true);
          try { await dispatch(createLot(form)).unwrap(); setOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={() => setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onEdit = (row) => {
    setTitle("Modifier le Lot");
    setNode(
      <LotForm
        initialData={row}
        onSave={async (form) => {
          setBusy(true);
          try { await dispatch(updateLot({ id: row.id, data: form })).unwrap(); setOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={() => setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onDeleteOne = (row) => {
    setTitle("Supprimer le Lot");
    setNode(
      <DeleteConfirm
        names={[row.nom]}
        onConfirm={async () => {
          setBusy(true);
          try { await dispatch(deleteLot(row.id)).unwrap(); setOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={() => setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onDeleteMany = () => {
    const ids = selectedRows.map(r => r.id);
    const names = selectedRows.map(r => r.nom);
    setTitle("Supprimer la sélection");
    setNode(
      <DeleteConfirm
        names={names}
        onConfirm={async () => {
          setBusy(true);
          try {
            await dispatch(deleteManyLots(ids)).unwrap();
            setClearSelToggle(v => !v);
            setOpen(false);
          } finally { setBusy(false); }
        }}
        onCancel={() => setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  // Colonnes (on n'affiche pas les todos)
  const columns = [
    { name: "Nom", selector: (r) => r.nom, sortable: true, wrap: true },
    { name: "Statut", selector: (r) => r.statut, sortable: true, width: "140px" },
    { name: "Montant", selector: (r) => fmtMoney(r.montant), sortable: true, width: "160px" },
    { name: "Pourcentage", selector: (r) => `${r.pourcentage ?? 0}%`, sortable: true, width: "140px" },
    { name: "Projet (ID)", selector: (r) => r.projet, sortable: true, width: "120px" },
    { name: "Créé le", selector: (r) => fmtDate(r.created_at), sortable: true, width: "120px" },
    { name: "MAJ le", selector: (r) => fmtDate(r.updated_at), sortable: true, width: "120px" },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(row)}>Modifier</Button>
          <Button size="sm" variant="destructive" onClick={() => onDeleteOne(row)}>Supprimer</Button>
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
          <CardTitle>Gestion des Lots</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Recherche" className="w-72" onChange={(e)=>setSearch(e.target.value)} />
            <Button onClick={onAdd}>Ajouter</Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {String(error)}
            </div>
          )}

          {selectedRows.length > 0 && (
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

      {/* Dialog pour toutes les opérations */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
          <div className="pt-2">{node}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
