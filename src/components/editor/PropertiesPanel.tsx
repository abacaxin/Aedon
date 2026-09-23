import { useRef, useState } from "react";
import type {
  FieldSchema,
  ProjectState,
  PropValue,
  SectionInstance,
  SectionVariant,
  Typography,
} from "@/lib/editor/types";
import { str, bool, list } from "@/lib/editor/props";
import { decodeLink, encodeLink, type LinkOptions } from "@/lib/editor/links";
import { parseImage, encodeImage, objectPosition } from "@/lib/editor/images";
import { TypographyPanel } from "./TypographyPanel";
import { PricingPanel } from "./PricingPanel";
import {
  Settings2,
  PanelRightClose,
  PanelRight,
  Type,
  Layers2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Crosshair,
  Wallet,
  PanelTop,
  Rocket,
  LayoutGrid,
  Image as ImageIcon,
  MessageSquareQuote,
  HelpCircle,
  Megaphone,
  PanelBottom,
  PaintBucket,
  ImagePlus,
  Loader2,
  GripVertical,
  type LucideIcon,
} from "lucide-react";

const KIND_ICON: Record<SectionVariant["kind"], LucideIcon> = {
  navbar: PanelTop,
  hero: Rocket,
  features: LayoutGrid,
  gallery: ImageIcon,
  testimonials: MessageSquareQuote,
  faq: HelpCircle,
  cta: Megaphone,
  footer: PanelBottom,
};

/** Groups a toggle (or any field) together with the fields whose `showWhen` targets it,
 *  so dependent settings render visually nested under the control that unlocks them. */
function groupFields(schema: FieldSchema[]) {
  const groups: { field: FieldSchema; children: FieldSchema[] }[] = [];
  let current: (typeof groups)[number] | null = null;
  for (const f of schema) {
    if (f.showWhen && current && f.showWhen.key === current.field.key) {
      current.children.push(f);
    } else {
      current = { field: f, children: [] };
      groups.push(current);
    }
  }
  return groups;
}

function shortColorLabel(label: string): string {
  return label.replace(/^Cor d[eo]\s*/i, "");
}

interface Props {
  instance: SectionInstance | null;
  variant: SectionVariant | null;
  typography: Typography;
  linkOptions: LinkOptions;
  project: ProjectState;
  onChange: (key: string, value: PropValue) => void;
  onApplyColorsToAll: () => void;
  canApplyColorsToAll: boolean;
  onListAdd: (key: string) => void;
  onListAddWithValues: (key: string, values: Record<string, string>) => void;
  onListRemove: (key: string, itemId: string) => void;
  onListChange: (key: string, itemId: string, field: string, value: string) => void;
  onListMove: (key: string, itemId: string, dir: -1 | 1) => void;
  onListReorder: (key: string, fromId: string, toId: string) => void;
  onTypographyChange: (patch: Partial<Typography>) => void;
  onToggleBillingAddon: (key: string) => void;
  onUploadImage: (file: File) => Promise<string>;
  open: boolean;
  onToggle: () => void;
  overlay?: boolean;
  onClose?: () => void;
}

export function PropertiesPanel(props: Props) {
  const {
    instance,
    variant,
    typography,
    project,
    open,
    onToggle,
    overlay,
    onClose,
    onTypographyChange,
    onToggleBillingAddon,
  } = props;
  const [tab, setTab] = useState<"section" | "type" | "pricing">("section");

  if (!open) {
    return (
      <div className="w-10 border-l border-border bg-card/40 flex flex-col items-center py-3 gap-2 shrink-0">
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground"
          title="Abrir propriedades"
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const asideCls = overlay
    ? "absolute inset-y-0 right-0 z-30 w-80 max-w-[92vw] border-l border-border bg-card shadow-2xl flex flex-col"
    : "w-80 shrink-0 border-l border-border bg-card/40 flex flex-col";

  return (
    <>
      {overlay && <div className="absolute inset-0 z-20 bg-black/50" onClick={onClose} />}
      <aside className={asideCls}>
        <div className="h-11 shrink-0 px-2 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-0.5 bg-secondary rounded-full text-xs overflow-x-auto scrollbar-none">
            <button
              onClick={() => setTab("section")}
              className={`shrink-0 px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${tab === "section" ? "bg-background text-foreground" : "text-muted-foreground"}`}
            >
              <Layers2 className="w-3 h-3" /> Seção
            </button>
            <button
              onClick={() => setTab("type")}
              className={`shrink-0 px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${tab === "type" ? "bg-background text-foreground" : "text-muted-foreground"}`}
            >
              <Type className="w-3 h-3" /> Tipografia
            </button>
            <button
              onClick={() => setTab("pricing")}
              className={`shrink-0 px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${tab === "pricing" ? "bg-background text-foreground" : "text-muted-foreground"}`}
            >
              <Wallet className="w-3 h-3" /> Preços
            </button>
          </div>
          <button
            onClick={overlay ? onClose : onToggle}
            className="w-7 h-7 shrink-0 rounded-md hover:bg-white/5 flex items-center justify-center text-muted-foreground"
            title="Fechar"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {tab === "type" ? (
            <TypographyPanel typography={typography} onChange={onTypographyChange} />
          ) : tab === "pricing" ? (
            <PricingPanel project={project} onToggleAddon={onToggleBillingAddon} />
          ) : !instance || !variant ? (
            <div className="p-6 text-xs text-muted-foreground text-center flex flex-col items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <Settings2 className="w-4 h-4" />
              </span>
              <div>
                <p className="font-medium text-foreground">Selecione uma seção</p>
                <p className="mt-1 leading-relaxed">Clique no preview para editar conteúdo, cores, imagens e links.</p>
              </div>
            </div>
          ) : (
            <SectionFields
              instance={instance}
              variant={variant}
              linkOptions={props.linkOptions}
              onChange={props.onChange}
              onApplyColorsToAll={props.onApplyColorsToAll}
              canApplyColorsToAll={props.canApplyColorsToAll}
              onListAdd={props.onListAdd}
              onListAddWithValues={props.onListAddWithValues}
              onListRemove={props.onListRemove}
              onListChange={props.onListChange}
              onListMove={props.onListMove}
              onListReorder={props.onListReorder}
              onUploadImage={props.onUploadImage}
            />
          )}
        </div>
      </aside>
    </>
  );
}

function SectionFields({
  instance,
  variant,
  linkOptions,
  onChange,
  onApplyColorsToAll,
  canApplyColorsToAll,
  onListAdd,
  onListAddWithValues,
  onListRemove,
  onListChange,
  onListMove,
  onListReorder,
  onUploadImage,
}: {
  instance: SectionInstance;
  variant: SectionVariant;
  linkOptions: LinkOptions;
  onChange: Props["onChange"];
  onApplyColorsToAll: Props["onApplyColorsToAll"];
  canApplyColorsToAll: Props["canApplyColorsToAll"];
  onListAdd: Props["onListAdd"];
  onListAddWithValues: Props["onListAddWithValues"];
  onListRemove: Props["onListRemove"];
  onListChange: Props["onListChange"];
  onListMove: Props["onListMove"];
  onListReorder: Props["onListReorder"];
  onUploadImage: Props["onUploadImage"];
}) {
  const [applied, setApplied] = useState(false);
  const visible = (f: FieldSchema) =>
    !f.showWhen || instance.props[f.showWhen.key] === f.showWhen.equals;

  const colorFields = variant.schema.filter((f) => f.type === "color");
  const contentSchema = variant.schema.filter((f) => f.type !== "color");
  const groups = groupFields(contentSchema);
  const Icon = KIND_ICON[variant.kind] ?? Layers2;

  const renderField = (f: FieldSchema) =>
    f.type === "list" && f.key === "images" && f.itemSchema?.some((item) => item.type === "image") ? (
      <PhotoGridField
        key={f.key}
        field={f}
        items={list(instance.props, f.key)}
        onAdd={() => onListAdd(f.key)}
        onRemove={(itemId) => onListRemove(f.key, itemId)}
        onChange={(itemId, field, value) => onListChange(f.key, itemId, field, value)}
        onReorder={(fromId, toId) => onListReorder(f.key, fromId, toId)}
        onUploadImage={onUploadImage}
      />
    ) : f.type === "list" ? (
      <ListField
        key={f.key}
        field={f}
        items={list(instance.props, f.key)}
        linkOptions={linkOptions}
        onAdd={() => onListAdd(f.key)}
        onAddWithValues={(values) => onListAddWithValues(f.key, values)}
        onRemove={(itemId) => onListRemove(f.key, itemId)}
        onChange={(itemId, field, value) => onListChange(f.key, itemId, field, value)}
        onMove={(itemId, dir) => onListMove(f.key, itemId, dir)}
        onReorder={(fromId, toId) => onListReorder(f.key, fromId, toId)}
        onUploadImage={onUploadImage}
      />
    ) : (
      <ScalarField
        key={f.key}
        field={f}
        instance={instance}
        linkOptions={linkOptions}
        onChange={onChange}
        onUploadImage={onUploadImage}
      />
    );

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold">{variant.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{variant.description}</div>
        </div>
      </div>

      {colorFields.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Cores
          </div>
          <div className="grid grid-cols-3 gap-2">
            {colorFields.map((f) => (
              <ColorSwatchField
                key={f.key}
                field={f}
                value={str(instance.props, f.key)}
                onChange={(v) => onChange(f.key, v)}
              />
            ))}
          </div>
          {canApplyColorsToAll && (
            <button
              onClick={() => {
                onApplyColorsToAll();
                setApplied(true);
                setTimeout(() => setApplied(false), 1500);
              }}
              className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 hover:border-foreground/30 hover:bg-white/[0.03] text-xs text-muted-foreground hover:text-foreground py-2 transition-all"
            >
              <PaintBucket className="w-3.5 h-3.5" />
              {applied ? "Cores aplicadas!" : "Aplicar cores em todas as seções"}
            </button>
          )}
        </div>
      )}

      <VisualEffectsPanel instance={instance} onChange={onChange} />

      <div className="h-px bg-border" />

      <div className="space-y-4">
        {groups.map(({ field: f, children }) => {
          if (!visible(f)) return null;
          const visibleChildren = children.filter(visible);
          return (
            <div key={f.key}>
              {renderField(f)}
              {visibleChildren.length > 0 && (
                <div className="mt-3 ml-1 pl-3 border-l-2 border-foreground/20 space-y-3">
                  {visibleChildren.map(renderField)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Compact swatch used for the bg/text/accent color trio — a colored square, hex
 *  underneath, and a short label, three to a row instead of three full-width rows. */
function ColorSwatchField({
  field: f,
  value,
  onChange,
}: {
  field: FieldSchema;
  value: string;
  onChange: (v: string) => void;
}) {
  const v = value || "#000000";
  return (
    <div className="flex flex-col gap-1 items-center">
      <input
        type="color"
        value={v}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
        title={f.label}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-[10px] font-mono bg-input/40 border border-border rounded px-1 py-0.5 text-center outline-none focus:border-foreground/40 transition-all"
      />
      <span className="text-[10px] text-muted-foreground text-center leading-tight truncate w-full">
        {shortColorLabel(f.label)}
      </span>
    </div>
  );
}

function VisualEffectsPanel({
  instance,
  onChange,
}: {
  instance: SectionInstance;
  onChange: (key: string, value: PropValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const gradientEnabled = bool(instance.props, "gradientEnabled");
  const base = str(instance.props, "bg", "#000000");
  const accent = str(instance.props, "accent", "#D4D4D8");
  const control = "w-full rounded-lg border border-border bg-input/40 px-3 py-2 text-xs text-foreground outline-none focus:border-foreground/40";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-white/5"
        aria-expanded={open}
      >
        <span>
          <span className="block text-xs font-medium text-foreground">Fundo e movimento</span>
          <span className="mt-0.5 block text-[10px] text-muted-foreground">Gradiente, entrada e comportamento no scroll</span>
        </span>
        <span className="text-xs text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-3 px-2 pb-2 pt-3">
          <button
            type="button"
            onClick={() => onChange("gradientEnabled", !gradientEnabled)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-input/40 px-3 py-2.5 text-left"
          >
            <span className="text-xs font-medium text-foreground">Usar gradiente</span>
            <span className={`relative h-5 w-9 rounded-full transition-colors ${gradientEnabled ? "bg-foreground" : "bg-white/15"}`}>
              <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${gradientEnabled ? "translate-x-4" : ""}`} />
            </span>
          </button>
          {gradientEnabled && (
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[10px] text-muted-foreground">
                Início
                <input
                  type="color"
                  value={str(instance.props, "gradientFrom", base)}
                  onChange={(event) => onChange("gradientFrom", event.target.value)}
                  className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                />
              </label>
              <label className="text-[10px] text-muted-foreground">
                Fim
                <input
                  type="color"
                  value={str(instance.props, "gradientTo", accent)}
                  onChange={(event) => onChange("gradientTo", event.target.value)}
                  className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                />
              </label>
              <label className="col-span-2 text-[10px] text-muted-foreground">
                Direção do gradiente
                <select
                  value={str(instance.props, "gradientDirection", "135deg")}
                  onChange={(event) => onChange("gradientDirection", event.target.value)}
                  className={`${control} mt-1`}
                >
                  <option value="135deg">Diagonal</option>
                  <option value="180deg">De cima para baixo</option>
                  <option value="90deg">Da esquerda para direita</option>
                  <option value="45deg">Diagonal inversa</option>
                </select>
              </label>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] text-muted-foreground">
              Animação de entrada
              <select
                value={str(instance.props, "entryAnimation", "none")}
                onChange={(event) => onChange("entryAnimation", event.target.value)}
                className={`${control} mt-1`}
              >
                <option value="none">Sem animação</option>
                <option value="fade">Fade suave</option>
                <option value="slide-up">Subir</option>
                <option value="slide-left">Entrar pela esquerda</option>
                <option value="zoom">Zoom sutil</option>
              </select>
            </label>
            <label className="text-[10px] text-muted-foreground">
              Efeito ao rolar
              <select
                value={str(instance.props, "scrollEffect", "none")}
                onChange={(event) => onChange("scrollEffect", event.target.value)}
                className={`${control} mt-1`}
              >
                <option value="none">Nenhum</option>
                <option value="parallax">Parallax sutil</option>
                <option value="fade">Fade no scroll</option>
              </select>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function ScalarField({
  field: f,
  instance,
  linkOptions,
  onChange,
  onUploadImage,
}: {
  field: FieldSchema;
  instance: SectionInstance;
  linkOptions: LinkOptions;
  onChange: (key: string, value: PropValue) => void;
  onUploadImage: (file: File) => Promise<string>;
}) {
  if (f.type === "toggle") {
    const checked = bool(instance.props, f.key);
    return (
      <button
        onClick={() => onChange(f.key, !checked)}
        className="w-full flex items-center justify-between gap-3 rounded-lg border border-border bg-input/40 px-3 py-2.5 hover:border-white/20 transition-all"
      >
        <span className="text-xs font-medium text-foreground text-left">{f.label}</span>
        <span
          className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${checked ? "bg-foreground" : "bg-white/15"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`}
          />
        </span>
      </button>
    );
  }

  const val = str(instance.props, f.key);
  return (
    <div>
      <label className="text-[11px] text-muted-foreground font-medium mb-1.5 block">
        {f.label}
      </label>
      <FieldInput
        field={f}
        value={val}
        linkOptions={linkOptions}
        onChange={(v) => onChange(f.key, v)}
        onUploadImage={onUploadImage}
      />
    </div>
  );
}

/** Renders the raw control for a primitive field. Reused by scalar fields and list items. */
function FieldInput({
  field: f,
  value,
  linkOptions,
  onChange,
  onUploadImage,
}: {
  field: FieldSchema;
  value: string;
  linkOptions: LinkOptions;
  onChange: (v: string) => void;
  onUploadImage: (file: File) => Promise<string>;
}) {
  const base =
    "w-full text-sm bg-input/60 border border-border rounded-lg px-3 py-2 outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 transition-all";
  if (f.type === "link") {
    return <LinkPicker value={value} options={linkOptions} onChange={onChange} />;
  }
  if (f.type === "image") {
    return <FocalImageInput value={value} onChange={onChange} onUploadImage={onUploadImage} />;
  }
  if (f.type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={`${base} resize-none`}
      />
    );
  }
  if (f.type === "select") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={base}>
        {(f.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (f.type === "color") {
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-9 rounded-lg bg-transparent border border-border cursor-pointer shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${base} font-mono`}
        />
      </div>
    );
  }
  return (
    <input
      type={f.type === "url" ? "url" : "text"}
      value={value}
      placeholder={f.placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={base}
    />
  );
}

function PhotoGridField({
  field: f,
  items,
  onAdd,
  onRemove,
  onChange,
  onReorder,
  onUploadImage,
}: {
  field: FieldSchema;
  items: Array<Record<string, string> & { _id: string }>;
  onAdd: () => void;
  onRemove: (itemId: string) => void;
  onChange: (itemId: string, field: string, value: string) => void;
  onReorder: (fromId: string, toId: string) => void;
  onUploadImage: (file: File) => Promise<string>;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const canAdd = f.max === undefined || items.length < f.max;
  const canRemove = items.length > (f.min ?? 0);
  const imageField = f.itemSchema?.find((item) => item.type === "image");

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <label className="text-[11px] text-muted-foreground font-medium">{f.label}</label>
          <p className="mt-0.5 text-[10px] text-muted-foreground/70">Arraste uma foto pelo ícone para alterar a posição no grid.</p>
        </div>
        <span className="text-[10px] text-muted-foreground/70">{items.length}{f.max ? `/${f.max}` : ""}</span>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {items.map((item, index) => (
          <div
            key={item._id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const fromId = event.dataTransfer.getData("text/plain") || draggedId;
              if (fromId) onReorder(fromId, item._id);
              setDraggedId(null);
            }}
            className={`rounded-xl border bg-black/30 p-2.5 transition-colors ${
              draggedId === item._id ? "border-foreground/50 opacity-60" : "border-white/10"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Foto {index + 1}</span>
              <div className="flex items-center gap-1">
                <span
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", item._id);
                    setDraggedId(item._id);
                  }}
                  onDragEnd={() => setDraggedId(null)}
                  className="h-6 w-6 cursor-grab rounded-md text-muted-foreground hover:bg-white/10 hover:text-foreground active:cursor-grabbing flex items-center justify-center"
                  title="Arrastar para alterar posição"
                  aria-label="Arrastar para alterar posição"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </span>
                <MiniBtn onClick={() => onRemove(item._id)} disabled={!canRemove} title="Remover foto">
                  <Trash2 className="w-3 h-3" />
                </MiniBtn>
              </div>
            </div>
            {imageField && (
              <FocalImageInput
                value={item[imageField.key] ?? ""}
                onChange={(value) => onChange(item._id, imageField.key, value)}
                onUploadImage={onUploadImage}
              />
            )}
          </div>
        ))}
      </div>
      <button
        onClick={onAdd}
        disabled={!canAdd}
        className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 hover:border-foreground/30 hover:bg-white/[0.03] text-xs text-muted-foreground hover:text-foreground py-2 transition-all disabled:opacity-30 disabled:pointer-events-none"
      >
        <Plus className="w-3.5 h-3.5" /> Adicionar foto
      </button>
    </div>
  );
}

function ListField({
  field: f,
  items,
  linkOptions,
  onAdd,
  onAddWithValues,
  onRemove,
  onChange,
  onMove,
  onReorder,
  onUploadImage,
}: {
  field: FieldSchema;
  items: Array<Record<string, string> & { _id: string }>;
  linkOptions: LinkOptions;
  onAdd: () => void;
  onAddWithValues: (values: Record<string, string>) => void;
  onRemove: (itemId: string) => void;
  onChange: (itemId: string, field: string, value: string) => void;
  onMove: (itemId: string, dir: -1 | 1) => void;
  onReorder: (fromId: string, toId: string) => void;
  onUploadImage: (file: File) => Promise<string>;
}) {
  const itemSchema = f.itemSchema ?? [];
  const canAdd = f.max === undefined || items.length < f.max;
  const canRemove = items.length > (f.min ?? 0);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const visibleItemFields = (item: Record<string, string> & { _id: string }) => {
    if (f.key !== "blocks") return itemSchema;
    const type = item.type || "text";
    return itemSchema.filter((field) => {
      if (field.key === "type") return true;
      if (type === "heading") return field.key === "title";
      if (type === "text") return field.key === "text";
      if (type === "image") return field.key === "image" || field.key === "alt";
      if (type === "button") return field.key === "label" || field.key === "link";
      return false;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] text-muted-foreground font-medium">{f.label}</label>
        <span className="text-[10px] text-muted-foreground/70">
          {items.length}
          {f.max ? `/${f.max}` : ""}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={item._id}
            className="rounded-lg border border-white/10 bg-black/30 p-2.5 space-y-2"
            onDragOver={f.key === "blocks" ? (event) => event.preventDefault() : undefined}
            onDrop={f.key === "blocks" ? (event) => {
              event.preventDefault();
              if (draggedId && draggedId !== item._id) onReorder(draggedId, item._id);
              setDraggedId(null);
            } : undefined}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {f.key === "blocks" && (
                  <button
                    type="button"
                    draggable
                    onDragStart={() => setDraggedId(item._id)}
                    onDragEnd={() => setDraggedId(null)}
                    title="Arraste para reorganizar"
                    className="cursor-grab touch-none text-muted-foreground/50 hover:text-foreground active:cursor-grabbing"
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </button>
                )}
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  {f.key === "blocks" ? (item.type || "texto") : f.itemLabel ?? "Item"} {f.key === "blocks" ? `· ${i + 1}` : i + 1}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <MiniBtn
                  onClick={() => onMove(item._id, -1)}
                  disabled={i === 0}
                  title="Mover para cima"
                >
                  <ChevronUp className="w-3 h-3" />
                </MiniBtn>
                <MiniBtn
                  onClick={() => onMove(item._id, 1)}
                  disabled={i === items.length - 1}
                  title="Mover para baixo"
                >
                  <ChevronDown className="w-3 h-3" />
                </MiniBtn>
                <MiniBtn onClick={() => onRemove(item._id)} disabled={!canRemove} title="Remover">
                  <Trash2 className="w-3 h-3" />
                </MiniBtn>
              </div>
            </div>
            {visibleItemFields(item).map((sf) => (
              <div key={sf.key}>
                {visibleItemFields(item).length > 1 && (
                  <label className="text-[10px] text-muted-foreground/80 mb-1 block">
                    {sf.label}
                  </label>
                )}
                <FieldInput
                  field={sf}
                  value={item[sf.key] ?? ""}
                  linkOptions={linkOptions}
                  onChange={(v) => onChange(item._id, sf.key, v)}
                  onUploadImage={onUploadImage}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      {f.key === "blocks" ? (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {[
            ["heading", "Título"],
            ["text", "Texto"],
            ["image", "Imagem"],
            ["button", "Botão"],
            ["divider", "Divisor"],
          ].map(([type, label]) => (
            <button
              key={type}
              type="button"
              onClick={() => onAddWithValues({ type })}
              disabled={!canAdd}
              className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 px-2 py-2 text-[11px] text-muted-foreground transition-all hover:border-foreground/30 hover:bg-white/[0.03] hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <Plus className="h-3 w-3" /> {label}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={onAdd}
          disabled={!canAdd}
          className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 hover:border-foreground/30 hover:bg-white/[0.03] text-xs text-muted-foreground hover:text-foreground py-2 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar {f.itemLabel?.toLowerCase() ?? "item"}
        </button>
      )}
    </div>
  );
}

function MiniBtn({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-6 h-6 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:pointer-events-none flex items-center justify-center transition-colors"
    >
      {children}
    </button>
  );
}

/** Picker for a link target: none / section / page / external URL. */
function LinkPicker({
  value,
  options,
  onChange,
}: {
  value: string;
  options: LinkOptions;
  onChange: (v: string) => void;
}) {
  const target = decodeLink(value);
  const base =
    "w-full text-sm bg-input/60 border border-border rounded-lg px-3 py-2 outline-none focus:border-foreground/40 transition-all";

  const setKind = (kind: string) => {
    if (kind === "none") onChange("");
    else if (kind === "url") onChange(encodeLink({ kind: "url", url: "" }));
    else if (kind === "page")
      onChange(encodeLink({ kind: "page", pageId: options.pages[0]?.id ?? "" }));
    else if (kind === "section")
      onChange(encodeLink({ kind: "section", sectionId: options.sections[0]?.id ?? "" }));
  };

  return (
    <div className="space-y-1.5">
      <select value={target.kind} onChange={(e) => setKind(e.target.value)} className={base}>
        <option value="none">Sem link</option>
        <option value="section">Rolar até uma seção</option>
        <option value="page">Ir para outra página</option>
        <option value="url">URL externa</option>
      </select>

      {target.kind === "url" && (
        <input
          type="url"
          value={target.url}
          placeholder="https://exemplo.com"
          onChange={(e) => onChange(encodeLink({ kind: "url", url: e.target.value }))}
          className={base}
        />
      )}
      {target.kind === "page" && (
        <select
          value={target.pageId}
          onChange={(e) => onChange(encodeLink({ kind: "page", pageId: e.target.value }))}
          className={base}
        >
          {options.pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
      {target.kind === "section" && (
        <select
          value={target.sectionId}
          onChange={(e) => onChange(encodeLink({ kind: "section", sectionId: e.target.value }))}
          className={base}
        >
          {options.sections.length === 0 && <option value="">Nenhuma seção</option>}
          {options.sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

/** URL input + draggable focal-point picker (smart crop). */
function FocalImageInput({
  value,
  onChange,
  onUploadImage,
}: {
  value: string;
  onChange: (v: string) => void;
  onUploadImage: (file: File) => Promise<string>;
}) {
  const img = parseImage(value);
  const boxRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragging = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const base =
    "w-full text-sm bg-input/60 border border-border rounded-lg px-3 py-2 outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 transition-all";

  const setFocalFromEvent = (clientX: number, clientY: number) => {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    const fx = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
    const fy = Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100));
    onChange(encodeImage({ src: img.src, fx, fy }));
  };

  const selectFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const src = await onUploadImage(file);
      onChange(encodeImage({ src, fx: 50, fy: 50 }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input
          type="url"
          value={img.src}
          placeholder="https://imagem.com/foto.jpg"
          onChange={(e) => onChange(encodeImage({ src: e.target.value, fx: img.fx, fy: img.fy }))}
          className={base}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="h-9 shrink-0 rounded-lg border border-border px-2.5 text-xs font-medium text-foreground hover:bg-white/5 hover:border-foreground/30 disabled:opacity-60 flex items-center gap-1.5 transition-colors"
          title="Escolher imagem do dispositivo"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{uploading ? "Enviando" : "Enviar"}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="sr-only"
          onChange={(e) => void selectFile(e.target.files?.[0])}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">Envie uma imagem do dispositivo ou cole uma URL. Até 5 MB na nuvem e 1,5 MB no modo local.</p>
      {uploadError && <p className="text-[10px] text-destructive">{uploadError}</p>}
      {img.src && (
        <>
          <div
            ref={boxRef}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              dragging.current = true;
              setFocalFromEvent(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (dragging.current) setFocalFromEvent(e.clientX, e.clientY);
            }}
            onPointerUp={() => (dragging.current = false)}
            className="relative rounded-lg overflow-hidden border border-border aspect-video bg-black cursor-crosshair touch-none select-none"
          >
            <img
              src={img.src}
              alt=""
              draggable={false}
              className="w-full h-full object-cover pointer-events-none"
              style={{ objectPosition: objectPosition(img) }}
            />
            <div
              className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.5)] pointer-events-none"
              style={{ left: `${img.fx}%`, top: `${img.fy}%` }}
            >
              <div className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Crosshair className="w-3 h-3" />
            Arraste para definir o ponto focal · {Math.round(img.fx)}% {Math.round(img.fy)}%
          </div>
        </>
      )}
    </div>
  );
}
