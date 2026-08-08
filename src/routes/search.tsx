import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { EmptyState, LoadingState } from "@/components/states";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchEverything } from "@/services/views";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — TutorFlow" },
      { name: "description", content: "Search students, subjects, chapters, topics and lesson notes offline." },
      { property: "og:title", content: "Search — TutorFlow" },
      { property: "og:description", content: "Search students, subjects, chapters, topics and lesson notes offline." },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<LoadingState />}>
      <SearchPage />
    </ClientOnly>
  ),
});

function SearchPage() {
  const [query, setQuery] = useState("");
  const hits = useLiveQuery(() => searchEverything(query), [query]);

  return (
    <div className="space-y-5">
      <PageHeader title="Search" description="Everything is searched on this device — no internet needed." />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search a student, chapter, topic or note"
        aria-label="Search everything"
        autoFocus
      />

      {query.trim().length < 2 ? (
        <EmptyState icon={<SearchIcon className="size-5" />} title="Type at least 2 letters to search." />
      ) : hits === undefined ? (
        <LoadingState />
      ) : hits.length === 0 ? (
        <EmptyState title="Nothing found." description="Try a shorter or different word." />
      ) : (
        <ul className="card-surface divide-y divide-border">
          {hits.map((hit, index) => (
            <li key={`${hit.kind}-${index}`}>
              <Link
                to={hit.to}
                params={hit.params as never}
                className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 hover:bg-accent/50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{hit.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{hit.subtitle}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {hit.badge ? <Badge variant="secondary">{hit.badge}</Badge> : null}
                  <Badge variant="outline">{hit.kind}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
