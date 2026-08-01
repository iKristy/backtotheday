import { createFileRoute } from "@tanstack/react-router";
import { useLayoutEffect, useRef, useState } from "react";
import { format } from "date-fns";
import * as chrono from "chrono-node";
import { CalendarBlank } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Toggletip } from "@/components/ui/toggletip";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Back to the Day" },
      {
        name: "description",
        content:
          "Type any date in plain English and instantly find out what day of the week it was.",
      },
      { property: "og:title", content: "Back to the Day" },
      {
        property: "og:description",
        content:
          "Type any date in plain English and instantly find out what day of the week it was.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/og-image.png" },
    ],
  }),
  component: Index,
});

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MAX_WEEKDAY_LENGTH = Math.max(...DAYS.map((d) => d.length));

type Tone = "red" | "green" | "amber";

const TONE_CLASS: Record<Tone, string> = {
  red: "lcd-red",
  green: "lcd-green",
  amber: "lcd-amber",
};

function parseNaturalDate(input: string): Date | undefined {
  const parsed = chrono.parseDate(input);
  return parsed ?? undefined;
}

const PLACEHOLDER_DATE = new Date(1985, 9, 26);
const PLACEHOLDER_VALUE = format(PLACEHOLDER_DATE, "MMM dd yyyy");

function dateParts(d: Date) {
  return {
    month: format(d, "MMM").toUpperCase(),
    day: format(d, "dd"),
    year: format(d, "yyyy"),
  };
}

function LcdCells({
  value,
  tone,
  fillCells = 0,
  align = "center",
  className,
  loadAnimation,
}: {
  value: string;
  tone: Tone;
  fillCells?: number;
  align?: "center" | "left";
  className?: string;
  /** When true, play the power-on flicker animation on mount. */
  loadAnimation?: boolean;
}) {
  const pad = Math.max(fillCells - value.length, 0);
  const leadingPad = align === "left" ? 0 : Math.floor(pad / 2);
  const trailingPad = align === "left" ? pad : pad - leadingPad;
  const cells: (string | null)[] = [
    ...Array<null>(leadingPad).fill(null),
    ...value.split(""),
    ...Array<null>(trailingPad).fill(null),
  ];
  return (
    <div
      data-lcd-cells
      className={cn(
        "flex items-center gap-[0.06em] text-4xl leading-none sm:text-6xl",
        align === "left" ? "justify-start" : "justify-center",
        className,
      )}
    >
      {cells.map((char, i) => (
        <span key={i} className="relative inline-block">
          {/* Ghost "8" sets the cell width; the lit glyph is centered on top so
              narrower digits like "1" stay aligned with their unlit segments.
              Cells with a null char show only the unlit ghost. */}
          <span className="lcd lcd-ghost block text-center" style={{ letterSpacing: 0 }}>
            8
          </span>
          {char !== null ? (
            <span
              className={cn(
                "lcd lcd-value absolute inset-0 block text-center",
                TONE_CLASS[tone],
                loadAnimation && "lcd-power-on",
              )}
              style={{ letterSpacing: 0 }}
            >
              {char}
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

/** How many ghost cells fit in `container`, given a live LcdCells row. */
function measureFitCells(container: HTMLElement, minCells: number): number {
  const cellsEl = container.querySelector<HTMLElement>("[data-lcd-cells]");
  const firstCell = cellsEl?.firstElementChild as HTMLElement | null;
  if (!cellsEl || !firstCell) return minCells;

  const cellW = firstCell.getBoundingClientRect().width;
  if (cellW <= 0) return minCells;

  const gap = parseFloat(getComputedStyle(cellsEl).columnGap || "0") || 0;
  const { paddingLeft, paddingRight } = getComputedStyle(container);
  const available = container.clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight);
  const fitted = Math.floor((available + gap) / (cellW + gap));
  return Math.max(minCells, fitted);
}

/** Generous initial cell count so the SSR HTML already overfills the
 *  overflow-hidden container — avoids a flash when useLayoutEffect
 *  measures the real count during hydration. */
const SSR_FILL_CELLS = 40;

function useFitFillCells(minCells: number, enabled: boolean) {
  const windowRef = useRef<HTMLDivElement>(null);
  const [fillCells, setFillCells] = useState(enabled ? SSR_FILL_CELLS : minCells);

  useLayoutEffect(() => {
    if (!enabled) return;
    const container = windowRef.current;
    if (!container) return;

    const update = () => {
      setFillCells(measureFitCells(container, minCells));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    // Font-size breakpoint (text-5xl → sm:text-6xl) can change cell width
    // without resizing the container; observe the cell row too.
    const cellsEl = container.querySelector<HTMLElement>("[data-lcd-cells]");
    if (cellsEl) ro.observe(cellsEl);

    void document.fonts?.ready.then(update);

    return () => ro.disconnect();
  }, [minCells, enabled]);

  return { windowRef, fillCells };
}

function LcdBox({
  caption,
  value,
  tone,
  className,
  windowClassName,
  fillCells = 0,
  autoFill = false,
  align = "center",
  loadAnimation = false,
}: {
  caption?: string;
  value: string;
  tone: Tone;
  className?: string;
  windowClassName?: string;
  fillCells?: number;
  /** When true, pad with ghost cells to fill the window width. */
  autoFill?: boolean;
  align?: "center" | "left";
  loadAnimation?: boolean;
}) {
  const { windowRef, fillCells: fittedCells } = useFitFillCells(fillCells, autoFill);

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      {caption ? <span className="tc-caption text-base leading-none sm:text-lg">{caption}</span> : null}
      <div
        ref={autoFill ? windowRef : undefined}
        className={cn(
          "tc-window relative flex h-16 w-full items-center overflow-hidden rounded-xs px-2 sm:h-20",
          align === "left" ? "justify-start" : "justify-center",
          windowClassName,
        )}
      >
        <LcdCells
          value={value}
          tone={tone}
          fillCells={autoFill ? fittedCells : fillCells}
          align={align}
          loadAnimation={loadAnimation}
        />
      </div>
    </div>
  );
}

/** Stable minimum ghost-cell count for the time-entry window. */
const INPUT_MIN_CELLS = PLACEHOLDER_VALUE.length;

function CircuitRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-col items-center gap-3 py-5", className)}>
      <div className="mx-auto flex w-full max-w-xl items-end justify-center gap-5 px-5 sm:gap-8">
        {children}
      </div>
      <span className="tc-rowlabel text-xl leading-none sm:text-2xl">{label}</span>
    </div>
  );
}

function Index() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date>(() => new Date());
  const [now] = useState<Date>(() => new Date());
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { windowRef: inputWindowRef, fillCells: inputFillCells } = useFitFillCells(
    INPUT_MIN_CELLS,
    true,
  );

  /** Pan the LCD row (and the transparent input) so the caret stays in view. */
  const syncOverlayScroll = () => {
    const input = inputRef.current;
    const overlay = overlayRef.current;
    if (!input || !overlay) return;

    const cellsEl = overlay.querySelector<HTMLElement>("[data-lcd-cells]");
    const firstCell = cellsEl?.firstElementChild as HTMLElement | null;
    if (!cellsEl || !firstCell) {
      overlay.scrollLeft = input.scrollLeft;
      return;
    }

    const cellW = firstCell.getBoundingClientRect().width;
    if (cellW <= 0) return;

    const gap = parseFloat(getComputedStyle(cellsEl).columnGap || "0") || 0;
    const stride = cellW + gap;
    const caret = input.selectionEnd ?? input.value.length;
    const caretX = caret * stride;
    const viewW = overlay.clientWidth;

    let next = overlay.scrollLeft;
    // Keep ~1 cell of room past the caret when typing off the right edge.
    if (caretX + stride > next + viewW) next = caretX + stride - viewW;
    if (caretX < next) next = caretX;
    next = Math.max(0, next);

    overlay.scrollLeft = next;
    input.scrollLeft = next;
  };

  useLayoutEffect(() => {
    syncOverlayScroll();
  }, [value]);

  const inputDate = date ?? PLACEHOLDER_DATE;
  const present = dateParts(now);
  const weekday = (DAYS[inputDate.getDay()] ?? "").toUpperCase();
  const lcdInputValue = (value || PLACEHOLDER_VALUE).toUpperCase();

  return (
    <main className="tc-panel flex min-h-screen flex-col py-3 sm:justify-center sm:py-5">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-2 px-3 pb-8 pt-5 sm:px-5 sm:pb-10">
          <h1 className="tc-logo">Back to the Day</h1>
          <p className="max-w-xs text-center text-sm text-neutral-700 sm:max-w-sm">
            What day was it? Use any{" "}
            <Toggletip label="short form">
              e.g. <i>01.01.2016</i> or <i>1/1/2016</i>
            </Toggletip>{" "}
            or{" "}
            <Toggletip label="long form">
              e.g. <i>Jan 1 2016</i> or <i>January 1st, 2016</i>
            </Toggletip>{" "}
            format, or pick a date using the calendar to find out.
            No plutonium required.
          </p>
        </div>

        <div className="tc-separator" />

        <CircuitRow label="Input Day">
          <div className="flex w-full flex-col items-center gap-1.5">
            <span className="tc-caption text-base leading-none sm:text-lg">Time Entry</span>
            <div className="tc-window relative flex h-16 w-full items-stretch overflow-hidden rounded-xs sm:h-20">
              <div ref={inputWindowRef} className="relative min-w-0 flex-1">
                <div
                  ref={overlayRef}
                  className="pointer-events-none absolute inset-0 overflow-x-hidden overflow-y-hidden py-0 pl-3.5 pr-2"
                >
                  <div className="flex h-full w-max min-w-full items-center">
                    <LcdCells
                      value={lcdInputValue}
                      tone="red"
                      fillCells={Math.max(inputFillCells, lcdInputValue.length)}
                      align="left"
                      loadAnimation
                      className={!value ? "lcd-placeholder-pulse" : undefined}
                    />
                  </div>
                </div>
                <Input
                  ref={inputRef}
                  id="date"
                  value={value}
                  placeholder={PLACEHOLDER_VALUE}
                  className="tc-input relative z-10 h-full w-full rounded-none border-0 bg-transparent py-0 pl-3.5 pr-2 text-4xl leading-none normal-case text-transparent sm:text-6xl focus-visible:ring-0 focus-visible:ring-offset-0"
                  onChange={(e) => {
                    const next = e.target.value;
                    setValue(next);
                    const parsed = parseNaturalDate(next);
                    setDate(parsed);
                    if (parsed) setMonth(parsed);
                    requestAnimationFrame(syncOverlayScroll);
                  }}
                  onScroll={syncOverlayScroll}
                  onSelect={syncOverlayScroll}
                  onKeyUp={syncOverlayScroll}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setOpen(true);
                    }
                  }}
                />
              </div>
              <div className="tc-input-btn-base h-full w-16 shrink-0 sm:w-20">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="date-picker"
                      variant="ghost"
                      data-state={open ? "open" : "closed"}
                      className="tc-input-btn shrink-0 rounded-none [&_svg]:size-6 sm:[&_svg]:size-8"
                    >
                      <CalendarBlank className="size-6 sm:size-8" weight="bold" />
                      <span className="sr-only">Open calendar</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="tc-datepicker w-auto overflow-hidden p-0"
                    align="end"
                    alignOffset={-8}
                    sideOffset={10}
                  >
                    <Calendar
                      mode="single"
                      selected={date}
                      captionLayout="dropdown"
                      month={month}
                      onMonthChange={setMonth}
                      onSelect={(selected) => {
                        setDate(selected);
                        setValue(selected ? format(selected, "MMM dd yyyy") : "");
                        setOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CircuitRow>

        <div className="tc-separator" />

        <CircuitRow label="Destination">
          <div className="flex w-full flex-col items-center gap-1.5">
            <span className="tc-caption text-base leading-none sm:text-lg">Day of Week</span>
            <div className="flex w-full items-end gap-5 sm:gap-6">
              <LcdBox
                value={weekday}
                tone="green"
                className="min-w-0 flex-1"
                fillCells={MAX_WEEKDAY_LENGTH}
                autoFill
                align="left"
                loadAnimation
              />
              <div
                className="flex h-16 shrink-0 flex-col items-center justify-center gap-5 sm:h-20"
                aria-hidden
              >
                <span className="tc-led tc-led-green tc-led-pulse led-power-on" />
                <span className="tc-led" />
              </div>
            </div>
          </div>
        </CircuitRow>

        <div className="tc-separator" />

        <CircuitRow label="Present Day">
          <LcdBox
            caption="Month"
            value={present.month}
            tone="amber"
            className="flex-[3] basis-0"
            windowClassName="px-3.5"
            loadAnimation
          />
          <LcdBox caption="Day" value={present.day} tone="amber" className="flex-[2] basis-0" loadAnimation />
          <div className="flex flex-[4] basis-0 items-end gap-5 sm:gap-6">
            <LcdBox
              caption="Year"
              value={present.year}
              tone="amber"
              className="min-w-0 flex-1"
              windowClassName="px-3.5"
              loadAnimation
            />
            <div
              className="flex h-16 shrink-0 flex-col items-center justify-center gap-5 sm:h-20"
              aria-hidden
            >
              <span className="tc-led tc-led-amber tc-led-pulse led-power-on" />
              <span className="tc-led" />
            </div>
          </div>
        </CircuitRow>
      </main>
  );
}
