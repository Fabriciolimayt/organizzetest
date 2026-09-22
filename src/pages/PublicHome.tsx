import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { PUBLIC_SITE_URL, publicHomeDestination } from "@/lib/public-site";

export default function PublicHome() {
  const { search, hash } = useLocation();
  const destination = publicHomeDestination(search, hash);
  useEffect(() => {
    if (destination === PUBLIC_SITE_URL) window.location.replace(PUBLIC_SITE_URL);
  }, [destination]);

  if (destination !== PUBLIC_SITE_URL) return <Navigate to={destination} replace />;
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl">Organizze</h1>
      <a href={PUBLIC_SITE_URL} rel="noreferrer" className="underline underline-offset-4">Ir para o site</a>
      <a href="/auth" className="underline underline-offset-4">Entrar na minha conta</a>
    </main>
  );
}
