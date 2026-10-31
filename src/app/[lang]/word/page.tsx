import Skeleton from "@mui/material/Skeleton"
import { Suspense } from "react"
import { WordView } from "./word-view"

export default async function WordPage({ params }: PageProps<"/[lang]/word">) {
  const { lang } = await params
  // WordView reads ?id= from the URL, which needs a Suspense boundary in a static export.
  return (
    <Suspense fallback={<Skeleton sx={{ mt: 3, minHeight: 480 }} />}>
      <WordView lang={lang} />
    </Suspense>
  )
}
