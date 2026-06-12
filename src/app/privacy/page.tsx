import { LegalDocument } from "@/components/legal/legal-document";
import { privacyContent } from "@/lib/legal-content";

export default function PrivacyPage() {
  return <LegalDocument content={privacyContent} />;
}
