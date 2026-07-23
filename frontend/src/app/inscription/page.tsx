"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    toast({
      variant: "success",
      title: "Compte créé",
      description: "Bienvenue sur Immobil'IA.",
    });
    router.push("/recherche");
  };

  return (
    <AuthShell
      title="Créer votre compte"
      subtitle="Gratuit, sans engagement. Changez de profil à tout moment."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-semibold text-gold-700 hover:text-gold-800">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Prénom" required placeholder="Léa" />
          <Input label="Nom" required placeholder="Fontaine" />
        </div>
        <Input label="E-mail" type="email" required placeholder="vous@exemple.fr" />
        <Input label="Mot de passe" type="password" required placeholder="••••••••" />
        <Select label="Je suis surtout…" defaultValue="acheteur">
          <option value="acheteur">Acheteur / locataire</option>
          <option value="vendeur">Vendeur / bailleur</option>
          <option value="investisseur">Investisseur</option>
        </Select>
        <Button type="submit" className="w-full" loading={loading}>
          <UserPlus className="size-4" aria-hidden />
          Créer mon compte
        </Button>
      </form>
    </AuthShell>
  );
}
