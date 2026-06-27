"use client";

import { buildLessonPlanHtml } from "@/lib/lesson-plan-html";
import type { FormValues } from "@/lib/types";
import { forwardRef } from "react";

interface LessonPlanPreviewProps {
  values: FormValues;
}

export const LessonPlanPreview = forwardRef<HTMLDivElement, LessonPlanPreviewProps>(
  function LessonPlanPreview({ values }, ref) {
    return (
      <div
        ref={ref}
        className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-100 p-4"
        dangerouslySetInnerHTML={{ __html: buildLessonPlanHtml(values) }}
      />
    );
  }
);
