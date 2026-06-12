import { LegalDocument } from "@/components/legal/legal-document";
import { termsContent } from "@/lib/legal-content";

export default function TermsPage() {
  return <LegalDocument content={termsContent} />;
}
