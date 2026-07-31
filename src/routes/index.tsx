import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "What Day Was It?" },
      { name: "description", content: "Pick any date and instantly find out what day of the week it was." },
      { property: "og:title", content: "What Day Was It?" },
      { property: "og:description", content: "Pick any date and instantly find out what day of the week it was." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function Index() {
  const [date, setDate] = useState<string>("");
  const [day, setDay] = useState<string | null>(null);

  const handleChange = (value: string) => {
    setDate(value);
    if (!value) {
      setDay(null);
      return;
    }
    const parsed = new Date(value + "T00:00:00");
    if (isNaN(parsed.getTime())) {
      setDay(null);
      return;
    }
    setDay(DAYS[parsed.getDay()]);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-card-foreground">
          What day was it?
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Pick or type any date to find out.
        </p>

        <div className="mt-6">
          <label htmlFor="date" className="sr-only">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none transition focus:ring-2 focus:ring-ring"
          />
        </div>

        {day && (
          <p className="mt-6 text-center text-lg font-medium text-primary">
            It was a {day}.
          </p>
        )}
      </div>
    </main>
  );
}
