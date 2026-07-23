"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogIn } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    toast({ variant: "success", title: "Connexion réussie", description: "Bon retour parmi nous." });
    router.push("/recherche");
  };

  return (
    <AuthShell
      title="Content de vous revoir"
      subtitle="Connectez-vous pour retrouver vos favoris, vos alertes et vos rapports."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-semibold text-gold-700 hover:text-gold-800">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input label="E-mail" type="email" required placeholder="vous@exemple.fr" />
        <Input label="Mot de passe" type="password" required placeholder="••••••••" />
        <Button type="submit" className="w-full" loading={loading}>
          <LogIn className="size-4" aria-hidden />
          Se connecter
        </Button>
      </form>
    </AuthShell>
  );
}
