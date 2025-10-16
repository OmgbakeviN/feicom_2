import { useEffect, useMemo, useState, useCallback } from "react";
import DataTable from "react-data-table-component";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchEntreprises, createEntreprise, updateEntreprise,
  deleteEntreprise, deleteManyEntreprises,
  selectEntreprises, selectEntreprisesLoading, selectEntreprisesError
} from "@/features/crud/entreprisesSlice";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// util: formatte une date ISO en YYYY-MM-DD (sans l'heure)
const fmtDate = (s) => (s ? String(s).split("T")[0] : "");

function EntrepriseForm({ initialData = {}, onSave, onCancel, loading }) {
  const [nom, setNom] = useState(initialData.nom || "");
  const [rcc, setRcc] = useState(initialData.rcc || "");
  const [niu, setNiu] = useState(initialData.niu || "");
  const [promoteur, setPromoteur] = useState(initialData.promoteur || "");
  const [contact, setContact] = useState(initialData.contact || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [siege, setSiege] = useState(initialData.siege_social || "");

  useEffect(() => {
    setNom(initialData.nom || "");
    setRcc(initialData.rcc || "");
    setNiu(initialData.niu || "");
    setPromoteur(initialData.promoteur || "");
    setContact(initialData.contact || "");
    setEmail(initialData.email || "");
    setSiege(initialData.siege_social || "");
  }, [initialData?.id]);

  const submit = (e) => {
    e.preventDefault();
    onSave({
      nom,
      rcc,
      niu,
      promoteur,
      contact,
      email,
      siege_social: siege,
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="nom">Nom</Label>
        <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="rcc">RCC</Label>
          <Input id="rcc" value={rcc} onChange={(e) => setRcc(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="niu">NIU</Label>
          <Input id="niu" value={niu} onChange={(e) => setNiu(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="promoteur">Promoteur</Label>
          <Input id="promoteur" value={promoteur} onChange={(e) => setPromoteur(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contact">Contact</Label>
          <Input id="contact" type="tel" value={contact} onChange={(e) => setContact(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="siege">Siège social</Label>
        <Input id="siege" value={siege} onChange={(e) => setSiege(e.target.value)} />
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : "Valider"}</Button>
      </DialogFooter>
    </form>
  );
}

function DeleteConfirm({ names = [], onConfirm, onCancel, loading }) {
  const label = names.length > 1 ? "les entreprises suivantes" : "l’entreprise suivante";
  return (
    <div className="space-y-4">
      <p>Voulez-vous vraiment supprimer {label} ?</p>
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

export default function EntreprisesTable() {
  const dispatch = useDispatch();
  const items = useSelector(selectEntreprises);
  const loading = useSelector(selectEntreprisesLoading);
  const error = useSelector(selectEntreprisesError);

  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [clearSelToggle, setClearSelToggle] = useState(false);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [node, setNode] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { dispatch(fetchEntreprises()); }, [dispatch]);

  // Filtre multi-champs
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    const f = (v) => (v || "").toString().toLowerCase().includes(q);
    return items.filter((r) =>
      f(r.nom) || f(r.rcc) || f(r.niu) || f(r.promoteur) || f(r.contact) || f(r.email) || f(r.siege_social)
    );
  }, [items, search]);

  const onSelect = useCallback((state) => setSelectedRows(state.selectedRows), []);

  // --- Actions → TOUJOURS dans un Dialog ---
  const onAdd = () => {
    setTitle("Ajouter une Entreprise");
    setNode(
      <EntrepriseForm
        onSave={async (form) => {
          setBusy(true);
          try { await dispatch(createEntreprise(form)).unwrap(); setOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={() => setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onEdit = (row) => {
    setTitle("Modifier l’Entreprise");
    setNode(
      <EntrepriseForm
        initialData={row}
        onSave={async (form) => {
          setBusy(true);
          try { await dispatch(updateEntreprise({ id: row.id, data: form })).unwrap(); setOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={() => setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onDeleteOne = (row) => {
    setTitle("Supprimer l’Entreprise");
    setNode(
      <DeleteConfirm
        names={[row.nom]}
        onConfirm={async () => {
          setBusy(true);
          try { await dispatch(deleteEntreprise(row.id)).unwrap(); setOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={() => setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onDeleteMany = () => {
    const ids = selectedRows.map((r) => r.id);
    const names = selectedRows.map((r) => r.nom);
    setTitle("Supprimer la sélection");
    setNode(
      <DeleteConfirm
        names={names}
        onConfirm={async () => {
          setBusy(true);
          try {
            await dispatch(deleteManyEntreprises(ids)).unwrap();
            setClearSelToggle((v) => !v);
            setOpen(false);
          } finally { setBusy(false); }
        }}
        onCancel={() => setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  // Colonnes (toutes les infos). created_at formaté YYYY-MM-DD
  const columns = [
    { name: "Nom", selector: (r) => r.nom, sortable: true, wrap: true },
    { name: "RCC", selector: (r) => r.rcc, sortable: true, wrap: true },
    { name: "NIU", selector: (r) => r.niu, sortable: true, wrap: true },
    { name: "Promoteur", selector: (r) => r.promoteur, sortable: true, wrap: true },
    { name: "Contact", selector: (r) => r.contact, sortable: true, wrap: true },
    { name: "Email", selector: (r) => r.email, sortable: true, wrap: true },
    { name: "Siège social", selector: (r) => r.siege_social, sortable: true, wrap: true },
    {
      name: "Créé le",
      selector: (r) => fmtDate(r.created_at),
      sortable: true,
      width: "120px",
    },
    {
      name: "Mis à jour",
      selector: (r) => fmtDate(r.updated_at),
      sortable: true,
      width: "120px",
    },
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
          <CardTitle>Gestion des Entreprises</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Recherche" className="w-72" onChange={(e) => setSearch(e.target.value)} />
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
              <div className="text-sm text-zinc-600">
                Supprimer la sélection ({selectedRows.length})
              </div>
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
