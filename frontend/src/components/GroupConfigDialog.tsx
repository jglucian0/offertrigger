import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  open: boolean;
  sessionId: string | null;
  onClose: () => void;
}

interface Group {
  id: string;
  name: string;
}

export function GroupConfigDialog({ open, onClose, sessionId }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || !sessionId) return;

    setGroups([]);
    setSaved([]);
    setDraft({});

    let isActive = true;

    async function load() {
      try {
        const [sessionGroups, dbGroups] = await Promise.all([
          fetch(`http://localhost:3001/session/groups/${sessionId}`).then(r => r.json()),
          fetch(`http://localhost:3001/niche-groups/${sessionId}`).then(r => r.json())
        ]);

        if (!isActive) return; // 🔥 ignora resposta antiga

        setGroups(sessionGroups);
        setSaved(dbGroups);

        const map: any = {};
        dbGroups.forEach((g: any) => {
          map[g.group_id] = g.niche;
        });

        setDraft(map);

      } catch (err) {
        console.error(err);
      }
    }

    load();

    return () => {
      isActive = false;
    };

  }, [open, sessionId]);

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    setDraft(p => {
      const n = { ...p };
      if (n[id] !== undefined) delete n[id];
      else n[id] = "";
      return n;
    });
  }

  async function save() {
    const original = new Set(saved.map(g => g.group_id));
    const current = new Set(Object.keys(draft));

    for (const id of current) {
      const group = groups.find(g => g.id === id)

      await fetch(`http://localhost:3001/niche-groups/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          groupId: id,
          groupName: group?.name,
          niche: draft[id]?.trim() || "sem nicho definido"
        })
      });
    }

    for (const id of original) {
      if (!current.has(id)) {
        const old = saved.find(s => s.group_id === id);
        await fetch(`http://localhost:3001/niche-groups/${sessionId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, groupId: id })
        });
      }
    }

    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-xl">
        <DialogHeader>
          <DialogTitle>Configurar grupos</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Buscar grupo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="max-h-96 overflow-y-auto space-y-2 mt-2">

          {filtered.map(group => (
            <div key={group.id} className="flex items-center gap-3 rounded-lg border border-border p-2">

              <Checkbox
                checked={draft[group.id] !== undefined}
                onCheckedChange={() => toggle(group.id)}
              />

              <span className="flex-1 text-sm truncate">{group.name}</span>

              {draft[group.id] !== undefined && (
                <Input
                  placeholder="Defina um nicho (opcional)"
                  className="w-30 text-xs"
                  value={draft[group.id]}
                  onChange={e =>
                    setDraft(p => ({ ...p, [group.id]: e.target.value }))
                  }
                />
              )}

            </div>
          ))}

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>

          <Button className="bg-primary" onClick={save}>
            Salvar
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
