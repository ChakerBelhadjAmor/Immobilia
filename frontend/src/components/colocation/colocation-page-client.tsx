"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Sparkles, Users, X } from "lucide-react";
import { colocProfiles } from "@/data/community";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/** EF-L-09 — roommate matching. */
export function ColocationPageClient() {
  const [enabled, setEnabled] = useState(false);
  const [passed, setPassed] = useState<Set<string>>(new Set());
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const visible = colocProfiles.filter(
    (p) => !passed.has(p.id) && !liked.has(p.id),
  );

  const like = (id: string, name: string) => {
    setLiked((prev) => new Set(prev).add(id));
    toast({
      variant: "success",
      title: "Intérêt envoyé",
      description: `${name} recevra votre demande de mise en relation.`,
    });
  };

  const pass = (id: string) => setPassed((prev) => new Set(prev).add(id));

  if (!enabled) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold-100 text-gold-700">
          <Users className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-navy-900 sm:text-3xl">
          Vous cherchez une colocation ?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-navy-500">
          Activez le matching de profils : l&rsquo;IA vous propose des
          colocataires compatibles selon le budget, le rythme de vie et les
          habitudes — pas seulement la disponibilité d&rsquo;une chambre.
        </p>
        <Button className="mt-6" onClick={() => setEnabled(true)}>
          <Sparkles className="size-4" aria-hidden />
          Activer le matching colocation
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">
            Profils compatibles à Lyon
          </h1>
          <p className="mt-2 max-w-xl text-sm text-navy-500">
            Classés par compatibilité : rythme de vie, budget et habitudes du
            quotidien.
          </p>
        </div>
        <Badge variant="gold" className="text-xs">
          <Sparkles className="size-3" aria-hidden />
          Matching activé
        </Badge>
      </header>

      {visible.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<Users className="size-6" aria-hidden />}
            title="Vous avez parcouru tous les profils disponibles"
            description="Revenez bientôt : de nouveaux profils compatibles sont ajoutés chaque semaine."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((profile, i) => (
            <motion.article
              key={profile.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="flex flex-col overflow-hidden rounded-card border border-sand-200 bg-white shadow-card"
            >
              <div className="relative">
                <div className="flex items-center gap-3 p-4">
                  <Image
                    src={profile.avatarUrl}
                    alt=""
                    width={56}
                    height={56}
                    className="size-14 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-sm font-semibold text-navy-900">
                      {profile.name}, {profile.age} ans
                    </h2>
                    <p className="text-xs text-navy-400">{profile.occupation}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p
                      className={cn(
                        "tnum font-display text-lg font-semibold",
                        profile.compatibility >= 88
                          ? "text-success-600"
                          : "text-gold-700",
                      )}
                    >
                      {profile.compatibility}%
                    </p>
                    <p className="text-[10px] text-navy-400">compatible</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 px-4">
                <p className="text-xs leading-relaxed text-navy-500">
                  {profile.bio}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.tags.map((tag) => (
                    <Badge key={tag} variant="sand" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="tnum mt-3 text-xs font-semibold text-navy-700">
                  Budget : {profile.budget} €/mois
                </p>
              </div>
              <div className="mt-4 flex gap-2 border-t border-sand-100 p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => pass(profile.id)}
                >
                  <X className="size-4" aria-hidden />
                  Passer
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => like(profile.id, profile.name)}
                >
                  <Heart className="size-4" aria-hidden />
                  Se connecter
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {liked.size > 0 && (
        <div className="mt-10 rounded-card border border-gold-300 bg-gold-50 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-navy-800">
            <MessageCircle className="size-4 text-gold-700" aria-hidden />
            {liked.size} mise{liked.size > 1 ? "s" : ""} en relation envoyée
            {liked.size > 1 ? "s" : ""}. Retrouvez les échanges dans vos
            messages.
          </p>
        </div>
      )}
    </div>
  );
}
