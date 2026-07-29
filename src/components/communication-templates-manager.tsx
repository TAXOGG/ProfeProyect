"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createCommunicationTemplate,
  updateCommunicationTemplate,
  deleteCommunicationTemplate,
  toggleFavoritoCommunicationTemplate,
} from "@/lib/actions/communication-templates";
import { OBSERVATION_VARIABLES } from "@/lib/observation-variables";
import { ConfirmModal } from "@/components/confirm-modal";
import { HelpTooltip } from "@/components/help-tooltip";
import type { CommunicationTemplate } from "@/lib/types";

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");
function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(DIACRITICS_RE, "");
}

function TemplateForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: CommunicationTemplate;
  onSubmit: (formData: FormData) => void;
  onCancel?: () => void;
}) {
  return (
    <form action={onSubmit} className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3">
      <textarea
        name="texto"
        required
        rows={3}
        defaultValue={initial?.texto ?? ""}
        placeholder="Ej: Estimada familia, quería contarles que {{nombre_estudiante}} ha mostrado un progreso notable en {{materia}}..."
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400"
      />
      <div className="grid grid-cols-3 gap-2">
        <input
          name="categoria"
          placeholder="Categoría"
          defaultValue={initial?.categoria ?? ""}
          className="rounded-md border border-zinc-300 px-2 py-1.5 text-xs placeholder:text-zinc-400"
        />
        <input
          name="materia"
          placeholder="Materia"
          defaultValue={initial?.materia ?? ""}
          className="rounded-md border border-zinc-300 px-2 py-1.5 text-xs placeholder:text-zinc-400"
        />
        <input
          name="nivel"
          placeholder="Nivel"
          defaultValue={initial?.nivel ?? ""}
          className="rounded-md border border-zinc-300 px-2 py-1.5 text-xs placeholder:text-zinc-400"
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="text-xs font-medium text-teal-700 hover:underline">
          Guardar
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-xs text-zinc-500 hover:underline">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export function CommunicationTemplatesManager({
  templates,
}: {
  templates: CommunicationTemplate[];
}) {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [soloFavoritas, setSoloFavoritas] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<CommunicationTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar.");
      }
    });
  }

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return templates.filter((t) => {
      if (soloFavoritas && !t.favorito) return false;
      if (!q) return true;
      return normalize(`${t.texto} ${t.categoria ?? ""} ${t.materia ?? ""} ${t.nivel ?? ""}`).includes(q);
    });
  }, [templates, query, soloFavoritas]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar..."
          className="min-w-[180px] flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm placeholder:text-zinc-500"
        />
        <label className="flex items-center gap-1.5 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={soloFavoritas}
            onChange={(e) => setSoloFavoritas(e.target.checked)}
            className="rounded"
          />
          Solo favoritas
        </label>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          + Nueva
        </button>
      </div>

      <p className="mt-2 flex items-center text-xs text-zinc-400">
        Se insertan en el mensaje al preparar una comunicación, junto con tus observaciones
        guardadas.
        <HelpTooltip text={`También admiten variables como ${OBSERVATION_VARIABLES.map((v) => `{{${v}}}`).join(", ")} — se completan solas al insertarlas.`} />
      </p>

      {creating && (
        <div className="mt-3">
          <TemplateForm
            onSubmit={(fd) => {
              run(async () => {
                await createCommunicationTemplate(fd);
                setCreating(false);
              });
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {filtered.map((t) =>
          editingId === t.id ? (
            <TemplateForm
              key={t.id}
              initial={t}
              onSubmit={(fd) => {
                run(async () => {
                  await updateCommunicationTemplate(t.id, fd);
                  setEditingId(null);
                });
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={t.id} className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-zinc-800">{t.texto}</p>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => run(() => toggleFavoritoCommunicationTemplate(t.id, !t.favorito))}
                  title={t.favorito ? "Quitar de favoritas" : "Marcar como favorita"}
                  className={`shrink-0 text-lg ${t.favorito ? "text-amber-500" : "text-zinc-300 hover:text-amber-400"}`}
                >
                  ★
                </button>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {[t.categoria, t.materia, t.nivel].filter(Boolean).length > 0 && (
                  <p className="text-xs text-zinc-400">
                    {[t.categoria, t.materia, t.nivel].filter(Boolean).join(" · ")}
                  </p>
                )}
                <span className="ml-auto flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditingId(t.id)}
                    className="font-medium text-teal-700 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(t)}
                    className="font-medium text-red-500 hover:underline"
                  >
                    Eliminar
                  </button>
                </span>
              </div>
            </div>
          ),
        )}

        {filtered.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-6 text-center text-sm text-zinc-500">
            {templates.length === 0
              ? "Todavía no guardaste ninguna plantilla de comunicación."
              : "Ninguna plantilla coincide con el filtro."}
          </p>
        )}
      </div>

      <ConfirmModal
        open={!!deleting}
        tone="danger"
        title="Eliminar plantilla"
        description="Esta plantilla de comunicación se va a eliminar. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (deleting) run(() => deleteCommunicationTemplate(deleting.id));
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
