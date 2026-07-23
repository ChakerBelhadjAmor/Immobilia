import type { User } from "@/types";

export const users: User[] = [
  {
    id: "u-01",
    firstName: "Camille",
    lastName: "Roussel",
    email: "camille.roussel@example.fr",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    role: "vendeur",
    memberSince: "2023-04-12",
    verified: true,
    rating: 4.8,
    reviewCount: 26,
  },
  {
    id: "u-02",
    firstName: "Julien",
    lastName: "Mercier",
    email: "julien.mercier@example.fr",
    avatarUrl: "https://i.pravatar.cc/150?img=12",
    role: "vendeur",
    memberSince: "2022-11-03",
    verified: true,
    rating: 4.5,
    reviewCount: 18,
  },
  {
    id: "u-03",
    firstName: "Inès",
    lastName: "Belkacem",
    email: "ines.belkacem@example.fr",
    avatarUrl: "https://i.pravatar.cc/150?img=45",
    role: "vendeur",
    memberSince: "2024-01-20",
    verified: true,
    rating: 4.9,
    reviewCount: 31,
  },
  {
    id: "u-04",
    firstName: "Thomas",
    lastName: "Lefèvre",
    email: "thomas.lefevre@example.fr",
    avatarUrl: "https://i.pravatar.cc/150?img=59",
    role: "vendeur",
    memberSince: "2023-08-15",
    verified: false,
    rating: 3.9,
    reviewCount: 7,
  },
  {
    id: "u-05",
    firstName: "Sophie",
    lastName: "Nguyen",
    email: "sophie.nguyen@example.fr",
    avatarUrl: "https://i.pravatar.cc/150?img=32",
    role: "vendeur",
    memberSince: "2021-06-30",
    verified: true,
    rating: 4.7,
    reviewCount: 44,
  },
  {
    id: "u-06",
    firstName: "Marc",
    lastName: "Delacroix",
    email: "marc.delacroix@example.fr",
    avatarUrl: "https://i.pravatar.cc/150?img=68",
    role: "investisseur",
    memberSince: "2022-02-14",
    verified: true,
    rating: 4.6,
    reviewCount: 12,
  },
];

/** The demo signed-in user (multi-profil : elle vend, cherche et investit). */
export const currentUser: User = {
  id: "u-00",
  firstName: "Léa",
  lastName: "Fontaine",
  email: "lea.fontaine@example.fr",
  avatarUrl: "https://i.pravatar.cc/150?img=44",
  role: "acheteur",
  memberSince: "2023-09-02",
  verified: true,
  rating: 4.9,
  reviewCount: 9,
};

export function getUserById(id: string) {
  if (id === currentUser.id) return currentUser;
  return users.find((u) => u.id === id);
}
