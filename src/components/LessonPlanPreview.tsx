"use client";

import { formValuesToLessonPlanDoc } from "@/lib/lesson-plan-html";
import { buildPhysicsLessonPlanHtml } from "@/lib/physics-lesson-plan-html";
import { paginatePhysicsLessonPlan } from "@/lib/physics-lesson-plan-pdf";
import type { FormValues } from "@/lib/types";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

interface LessonPlanPreviewProps {
  values: FormValues;
}

export const LessonPlanPreview = forwardRef<HTMLDivElement, LessonPlanPreviewProps>(
  function LessonPlanPreview({ values }, ref) {
    const localRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

    useEffect(() => {
      const root = localRef.current;
      if (!root) return;
      const plan = formValuesToLessonPlanDoc(values);
      root.innerHTML = buildPhysicsLessonPlanHtml(plan);
      const doc = root.querySelector(".physics-lesson-plan-doc");
      if (doc instanceof HTMLElement) {
        const id = requestAnimationFrame(() => {
          paginatePhysicsLessonPlan(doc);
        });
        return () => cancelAnimationFrame(id);
      }
    }, [values]);

    return (
      <div
        ref={localRef}
        className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-100 p-4"
      />
    );
  }
);
