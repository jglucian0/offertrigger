import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ChevronDown } from "lucide-react"
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
import {
  AlertDialog, AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface Props {
  niche: string
  interval: number
  start: string
  end: string
  paused: boolean
  groups: { group_id: string; group_name: string }[]
  onSave: (data: any) => void
}

export const NicheDispatchConfig = ({
  niche,
  interval,
  start,
  end,
  paused,
  groups,
  onSave
}: Props) => {

  const [open, setOpen] = useState(false)
  const [localInterval, setLocalInterval] = useState(interval)
  const [localStart, setLocalStart] = useState(start)
  const [localEnd, setLocalEnd] = useState(end)
  const [localPaused, setLocalPaused] = useState(paused)

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold">{niche}</span>
          <Badge variant="secondary">
            {groups.length} grupos
          </Badge>
        </div>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="p-4 space-y-4 border-t border-border">

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs">Intervalo (ms)</label>
              <Input
                type="number"
                value={localInterval}
                onChange={(e) => setLocalInterval(Number(e.target.value))}
                className="w-full border mt-2 rounded-2x2 px-2 py-1 bg-background [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>

            <div>
              <label className="text-xs">Início</label>
              <Input
                type="time"
                value={localStart}
                onChange={(e) => setLocalStart(e.target.value)}
                className="w-full border mt-2 rounded-2x2 px-2 py-1 bg-background [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>

            <div>
              <label className="text-xs">Fim</label>
              <Input
                type="time"
                value={localEnd}
                onChange={(e) => setLocalEnd(e.target.value)}
                className="w-full border mt-2 rounded-2x2 px-2 py-1 bg-background [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Ativo</span>
            <Switch
              checked={!localPaused}
              onCheckedChange={(v) => setLocalPaused(!v)}
            />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Grupos:</p>
            <div className="flex flex-wrap gap-2">
              {groups.map(g => (
                <Badge className="secondary text-secondary-foreground bg-secondary hover:bg-secondary" key={g.group_id}>{g.group_name}</Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button className="bg-primary" onClick={() => onSave({
              niche,
              interval: localInterval,
              start: localStart,
              end: localEnd,
              paused: localPaused
            })}>
              Salvar Configuração
            </Button>

          </DialogFooter>

        </div>
      )}
    </div>
  )
}
