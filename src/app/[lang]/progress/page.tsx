import { ProgressView } from "./ProgressView";

export default async function ProgressPage({ params }: PageProps<"/[lang]/progress">) {
  const { lang } = await params;
  return <ProgressView lang={lang} />;
}
