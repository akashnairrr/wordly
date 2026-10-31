import { HomeView } from "./home-view"

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params
  return <HomeView lang={lang} />
}
