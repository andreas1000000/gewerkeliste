import { notFound } from "next/navigation";

export const metadata = {
  title: "Nicht verfügbar | GewerkeListe.com",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaymentSuccessPage() {
  notFound();
}
