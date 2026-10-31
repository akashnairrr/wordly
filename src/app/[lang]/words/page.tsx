import { Suspense } from "react";
import { WordsView } from "./WordsView";

export default async function WordsPage({ params }: PageProps<"/[lang]/words">) {
  const { lang } = await params;
  // WordsView reads ?filter= from the URL, which needs a Suspense boundary in a static export.
  return (
    <Suspense fallback={<div className="card empty">Loading…</div>}>
      <WordsView lang={lang} />
    </Suspense>
  );
}
