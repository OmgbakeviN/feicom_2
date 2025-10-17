import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Mois disponibles
const MONTHS = [
    { value: "", label: "Tous les mois" },
    { value: "1", label: "Janvier" }, { value: "2", label: "Février" },
    { value: "3", label: "Mars" }, { value: "4", label: "Avril" },
    { value: "5", label: "Mai" }, { value: "6", label: "Juin" },
    { value: "7", label: "Juillet" }, { value: "8", label: "Août" },
    { value: "9", label: "Septembre" }, { value: "10", label: "Octobre" },
    { value: "11", label: "Novembre" }, { value: "12", label: "Décembre" },
];

// Petite capsule compteur pour la multi-sélection
function CommunesBadge({ count }) {
    if (!count) return <Badge variant="outline">Toutes les communes</Badge>;
    return <Badge>{count} commune{count > 1 ? "s" : ""}</Badge>;
}

/**
 * Props:
 * - role, agenceUserId : pour cacher/forcer l'agence si REGIONAL
 * - exercices, agences, communes : listes [{id, ...}]
 * - values : { exercice, agence, month, communes, search }
 * - onChange(name, value)
 * - onReset()
 * - onApply() : déclenche fetchByFilters côté parent (optionnel si fetch auto)
 * - loading
 */
export default function ProjectFilters({
    role, agenceUserId,
    exercices = [], agences = [], communes = [],
    values, onChange, onReset, onApply,
    loading,
}) {
    // Options formatées
    const exoOptions = useMemo(() => exercices.map(x => ({ value: String(x.id), label: String(x.annee) })), [exercices]);
    const agenceOptions = useMemo(() => agences.map(a => ({ value: String(a.id), label: a.nom })), [agences]);
    const communeOptions = useMemo(() => communes.map(c => ({ value: String(c.id), label: c.nom })), [communes]);

    const ALL = "ALL"

    // Filtre texte dans le menu communes
    const [q, setQ] = useState("");
    const visibleCommunes = useMemo(() => {
        const s = q.trim().toLowerCase();
        return s ? communeOptions.filter(c => c.label.toLowerCase().includes(s)) : communeOptions;
    }, [q, communeOptions]);

    const showAgence = role !== "REGIONAL"; // NATIONAL => peut choisir ; REGIONAL => caché

    return (
        <div className="grid gap-3 md:grid-cols-5 items-end">
            {/* Exercice */}
            <div className="grid gap-1">
                <label className="text-sm text-zinc-600">Exercice</label>
                <Select
                    value={values.exercice ? String(values.exercice) : ALL}
                    onValueChange={(v) => onChange("exercice", v === ALL ? "" : Number(v))}
                >
                    <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Tous</SelectItem>
                        {exoOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Agence (masqué pour REGIONAL) */}
            {showAgence ? (
                <div className="grid gap-1">
                    <label className="text-sm text-zinc-600">Agence</label>
                    <Select
                        value={values.agence ? String(values.agence) : ALL}
                        onValueChange={(v) => onChange("agence", v === ALL ? "" : Number(v))}
                    >
                        <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>Toutes</SelectItem>
                            {agenceOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            ) : (
                <div className="grid gap-1">
                    <label className="text-sm text-zinc-600">Agence</label>
                    <Input value={`#${agenceUserId}`} disabled />
                </div>
            )}

            {/* Mois */}
            <div className="grid gap-1">
                <label className="text-sm text-zinc-600">Mois (date début)</label>
                <Select
                    value={values.month ? String(values.month) : ALL}
                    onValueChange={(v) => onChange("month", v === ALL ? "" : Number(v))}
                >
                    <SelectTrigger><SelectValue placeholder="Tous les mois" /></SelectTrigger>
                    <SelectContent>
                        {/* Première option “Tous” avec sentinelle */}
                        <SelectItem value={ALL}>Tous les mois</SelectItem>
                        {MONTHS.filter(m => m.value !== "").map(m => (
                            <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Communes (multi) */}
            <div className="grid gap-1">
                <label className="text-sm text-zinc-600">Communes</label>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="justify-between">
                            <CommunesBadge count={values.communes?.length || 0} />
                            <span className="text-zinc-400">▾</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-72 p-2">
                        <Input placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-2" />
                        <div className="max-h-64 overflow-auto pr-1">
                            {visibleCommunes.length === 0 ? (
                                <div className="text-xs text-zinc-500 px-1 py-2">Aucune commune</div>
                            ) : visibleCommunes.map(c => {
                                const checked = (values.communes || []).map(String).includes(c.value);
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={c.value}
                                        checked={checked}
                                        onCheckedChange={(val) => {
                                            const current = new Set((values.communes || []).map(Number));
                                            val ? current.add(Number(c.value)) : current.delete(Number(c.value));
                                            onChange("communes", Array.from(current));
                                        }}
                                    >
                                        {c.label}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                        </div>
                        <div className="mt-2 flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => {
                                const set = new Set(values.communes || []);
                                visibleCommunes.forEach(c => set.add(Number(c.value)));
                                onChange("communes", Array.from(set));
                            }}>Tout sélectionner</Button>
                            <Button size="sm" variant="ghost" onClick={() => onChange("communes", [])}>Vider</Button>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Recherche & reset (auto-apply) */}
            <div className="grid gap-2">
                <Input
                    placeholder="Recherche…"
                    value={values.search || ""}
                    onChange={(e) => onChange("search", e.target.value)}
                />
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onReset} disabled={loading}>Reset</Button>
                </div>
            </div>
        </div>
    );
}
