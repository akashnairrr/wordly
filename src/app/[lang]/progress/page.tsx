import { ProgressView } from "./progress-view"

export default async function ProgressPage({ params }: PageProps<"/[lang]/progress">) {
  const { lang } = await params
  return <ProgressView lang={lang} />
}
