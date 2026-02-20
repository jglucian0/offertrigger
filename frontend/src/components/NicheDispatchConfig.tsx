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
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Play, Pause } from "lucide-react"

interface Props {
  niche: string
  interval: number
  start: string
  end: string
  paused: boolean
  groups: { group_id: string; group_name: string }[]
  onSave: (data: any) => void
  onDelete: (niche: string) => void
}

export const NicheDispatchConfig = ({
  niche,
  interval,
  start,
  end,
  paused,
  groups,
  onSave,
  onDelete
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
          <Badge
            variant={localPaused ? "secondary" : "default"}
            className={
              localPaused
                ? "bg-muted text-muted-foreground bg-primary text-primary-foreground"
                : "bg-green-600 text-white"
            }
          >
            {localPaused ? "Pausado" : "Rodando"}
          </Badge>
        </div>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="p-4 space-y-4 border-t border-border">

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs">Intervalo (minutos)</label>
              <Input
                type="number"
                min={5}
                value={localInterval}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  setLocalInterval(value < 5 ? 5 : value)
                }}
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
            <span className="text-sm font-medium">
              Status do disparo
            </span>

            <Button
              size="sm"
              variant={localPaused ? "secondary" : "default"}
              className={`
      gap-2
      ${localPaused
                  ? "gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-green-600 text-white hover:bg-green-700"}
    `}
              onClick={() => {
                const newPaused = !localPaused
                setLocalPaused(newPaused)

                // SALVA AUTOMATICAMENTE AO CLICAR
                onSave({
                  niche,
                  interval: localInterval,
                  start: localStart,
                  end: localEnd,
                  paused: newPaused
                })
              }}
            >
              {localPaused ? (
                <>
                  <Play className="h-4 w-4" />
                  Iniciar
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" />
                  Pausar
                </>
              )}
            </Button>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Grupos:</p>
            <div className="flex flex-wrap gap-2">
              {groups.map(g => (
                <Badge className="secondary text-secondary-foreground bg-secondary hover:bg-secondary" key={g.group_id}>{g.group_name}</Badge>
              ))}
            </div>
          </div>

          <DialogFooter className="flex justify-between gap-2">

            {/* BOTÃO EXCLUIR */}
            <AlertDialog>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                          disabled={groups.length > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </AlertDialogTrigger>
                  </TooltipTrigger>

                  {groups.length > 0 && (
                    <TooltipContent>
                      <p>Para excluir é preciso remover grupos cadastrados.</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Excluir nicho "{niche}"?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Essa ação removerá a configuração do nicho permanentemente.
                    Essa ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 "
                    onClick={() => onDelete(niche)}
                  >
                    Confirmar exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>


            {/* BOTÃO SALVAR */}
            <Button
              size="sm"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => onSave({
                niche,
                interval: localInterval,
                start: localStart,
                end: localEnd,
                paused: localPaused
              })}
            >
              Salvar Configuração
            </Button>

          </DialogFooter>

        </div>
      )}
    </div>
  )
}
