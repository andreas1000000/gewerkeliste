import { redirect } from "next/navigation";

export default function LegacyClaimRedirectPage() {
  redirect("/eintrag-beanspruchen");
}
