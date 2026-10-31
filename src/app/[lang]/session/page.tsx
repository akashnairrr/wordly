import { Suspense } from "react";
import { SessionView } from "./SessionView";

export default async function SessionPage({ params }: PageProps<"/[lang]/session">) {
  const { lang } = await params;
  // SessionView reads ?mode=review from the URL, which needs a Suspense boundary in a static export.
  return (
    <Suspense fallback={<div className="skeleton" style={{ marginTop: 24, minHeight: 420 }} />}>
      <SessionView lang={lang} />
    </Suspense>
  );
}
