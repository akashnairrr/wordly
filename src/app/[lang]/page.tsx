import { HomeView } from "./HomeView";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  return <HomeView lang={lang} />;
}
