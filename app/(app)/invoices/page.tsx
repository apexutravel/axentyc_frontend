import { Suspense } from "react";
import DocumentsView from "@/components/invoicing/DocumentsView";

export default function InvoicesPage() {
  return (
    <Suspense>
      <DocumentsView type="invoice" />
    </Suspense>
  );
}
