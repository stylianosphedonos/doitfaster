import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { FormBackLink } from "@/components/FormBackLink";
import { FormFiller } from "@/components/FormFiller";
import { getSession } from "@/lib/auth";
import { canExportPdf } from "@/lib/auth-types";
import { getFormById } from "@/lib/db";
import { getFormSaveForUser } from "@/lib/form-saves-db";

type PageProps = { params: Promise<{ id: string }> };

export default async function FormPage({ params }: PageProps) {
  const { id } = await params;
  const [form, session] = await Promise.all([getFormById(id), getSession()]);

  if (!form) {
    notFound();
  }

  const canExport = canExportPdf(session?.role ?? null);
  const savedTemplate = session
    ? await getFormSaveForUser(session.id, form.id)
    : null;

  return (
    <>
      <AppHeader />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <FormBackLink />
          <FormFiller
            form={form}
            canExport={canExport}
            canSave={!!session}
            initialSavedTemplate={savedTemplate}
          />
        </div>
      </main>
    </>
  );
}
