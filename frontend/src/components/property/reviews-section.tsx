"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MessageSquarePlus, Star } from "lucide-react";
import type { Review } from "@/types";
import { fetchReviews } from "@/services/property-service";
import { currentUser } from "@/data/users";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn, formatDate } from "@/lib/utils";

/** EF-L-11 — ratings & comments feeding the property score. */
export function ReviewsSection({ propertyId }: { propertyId: string }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews(propertyId).then(setReviews);
  }, [propertyId]);

  const submit = async () => {
    if (rating === 0 || comment.trim().length < 10) {
      toast({
        variant: "warning",
        title: "Avis incomplet",
        description:
          "Choisissez une note et écrivez un commentaire d'au moins 10 caractères.",
      });
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setReviews((prev) => [
      {
        id: `r-new-${Date.now()}`,
        propertyId,
        authorId: currentUser.id,
        authorName: `${currentUser.firstName} ${currentUser.lastName[0]}.`,
        authorAvatar: currentUser.avatarUrl,
        rating,
        comment: comment.trim(),
        date: new Date().toISOString().slice(0, 10),
      },
      ...(prev ?? []),
    ]);
    setRating(0);
    setComment("");
    setSubmitting(false);
    toast({
      variant: "success",
      title: "Avis publié",
      description:
        "Merci ! Votre note alimente le score d'honnêteté de cette annonce.",
    });
  };

  return (
    <section
      aria-labelledby="reviews-title"
      className="rounded-card border border-sand-200 bg-white p-5 shadow-card"
    >
      <h2 id="reviews-title" className="text-sm font-semibold text-navy-900">
        Avis & notation
      </h2>
      <p className="mt-1 text-xs text-navy-500">
        Les notes contribuent au score d&rsquo;honnêteté de l&rsquo;annonce.
      </p>

      {/* Formulaire */}
      <div className="mt-4 rounded-xl border border-sand-200 bg-sand-50/70 p-4">
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label="Votre note"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
            >
              <Star
                className={cn(
                  "size-6 transition-colors",
                  star <= (hovered || rating)
                    ? "fill-gold-500 text-gold-500"
                    : "text-sand-300",
                )}
                aria-hidden
              />
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Textarea
            aria-label="Votre commentaire"
            placeholder="Partagez votre expérience : visite, échanges avec le propriétaire, conformité de l'annonce…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-20 bg-white"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={submit} loading={submitting}>
            <MessageSquarePlus className="size-4" aria-hidden />
            Publier mon avis
          </Button>
        </div>
      </div>

      {/* Liste */}
      {reviews === null ? (
        <div className="mt-5 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={<Star className="size-5" aria-hidden />}
            title="Aucun avis pour l'instant"
            description="Soyez la première personne à évaluer ce bien après une visite."
            className="py-8"
          />
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="flex gap-3">
              <Image
                src={review.authorAvatar}
                alt=""
                width={36}
                height={36}
                className="size-9 shrink-0 rounded-full"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-navy-900">
                    {review.authorName}
                  </span>
                  <span
                    className="flex gap-0.5"
                    role="img"
                    aria-label={`${review.rating} sur 5`}
                  >
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "size-3.5",
                          s <= review.rating
                            ? "fill-gold-500 text-gold-500"
                            : "text-sand-300",
                        )}
                        aria-hidden
                      />
                    ))}
                  </span>
                  <span className="text-xs text-navy-400">
                    {formatDate(review.date)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-600">
                  {review.comment}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
