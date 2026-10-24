import { Suspense } from "react";
import DocumentsView from "@/components/invoicing/DocumentsView";

export default function QuotesPage() {
  return (
    <Suspense>
      <DocumentsView type="quote" />
    </Suspense>
  );
}
