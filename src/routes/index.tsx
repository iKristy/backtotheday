import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import * as chrono from "chrono-node";
import { CalendarBlank } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "What Day Was It?" },
      {
        name: "description",
        content:
          "Type any date in plain English and instantly find out what day of the week it was.",
      },
      { property: "og:title", content: "What Day Was It?" },
      {
        property: "og:description",
        content:
          "Type any date in plain English and instantly find out what day of the week it was.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseNaturalDate(input: string): Date | undefined {
  const parsed = chrono.parseDate(input);
  return parsed ?? undefined;
}

function Index() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date>(() => new Date());

  const day = date ? DAYS[date.getDay()] : null;

  return (
    <TooltipProvider delayDuration={100}>
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-center text-2xl font-semibold tracking-tight text-card-foreground">
            What day was it?
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Use any{" "}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help underline decoration-dotted">
                  short form
                </span>
              </TooltipTrigger>
              <TooltipContent>
                e.g. <i>01.01.2016</i> or <i>1/1/2016</i>
              </TooltipContent>
            </Tooltip>{" "}
            or{" "}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help underline decoration-dotted">
                  long form
                </span>
              </TooltipTrigger>
              <TooltipContent>
                e.g. <i>Jan 1 2016</i> or <i>January 1st, 2016</i>
              </TooltipContent>
            </Tooltip>{" "}
            format, or pick a date using the calendar to find out.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Label htmlFor="date" className="px-1 text-muted-foreground">
              Date
            </Label>
            <div className="relative flex gap-2">
              <Input
                id="date"
                value={value}
                placeholder="Pick or type any date..."
                className="bg-background pr-10"
                onChange={(e) => {
                  const next = e.target.value;
                  setValue(next);
                  const parsed = parseNaturalDate(next);
                  setDate(parsed);
                  if (parsed) setMonth(parsed);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setOpen(true);
                  }
                }}
              />
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="date-picker"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
                  >
                    <CalendarBlank className="size-4" weight="bold" />
                    <span className="sr-only">Open calendar</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
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
                      setValue(selected ? format(selected, "PPP") : "");
                      setOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {date && (
              <p className="px-1 text-sm text-muted-foreground">
                {format(date, "EEEE, MMMM d, yyyy")}
              </p>
            )}
          </div>

          {day && (
            <p className="mt-6 text-center text-lg font-medium text-primary">It was a {day}.</p>
          )}
        </div>
      </main>
    </TooltipProvider>
  );
}
