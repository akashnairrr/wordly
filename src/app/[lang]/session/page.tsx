import Skeleton from "@mui/material/Skeleton"
import { Suspense } from "react"
import { SessionView } from "./session-view"

export default async function SessionPage({ params }: PageProps<"/[lang]/session">) {
  const { lang } = await params
  // SessionView reads ?mode=review from the URL, which needs a Suspense boundary in a static export.
  return (
    <Suspense fallback={<Skeleton sx={{ mt: 3, minHeight: 420 }} />}>
      <SessionView lang={lang} />
    </Suspense>
  )
}
