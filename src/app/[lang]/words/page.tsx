import Skeleton from "@mui/material/Skeleton"
import { Suspense } from "react"
import { WordsView } from "./words-view"

export default async function WordsPage({ params }: PageProps<"/[lang]/words">) {
  const { lang } = await params
  // WordsView reads ?filter= from the URL, which needs a Suspense boundary in a static export.
  return (
    <Suspense fallback={<Skeleton sx={{ mt: 3, minHeight: 480 }} />}>
      <WordsView lang={lang} />
    </Suspense>
  )
}
