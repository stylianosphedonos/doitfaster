"use client";

import {
  buildPhysicsLessonPlanHtml,
  type PhysicsLessonPlanDoc,
} from "@/lib/physics-lesson-plan-html";
import { paginatePhysicsLessonPlan } from "@/lib/physics-lesson-plan-pdf";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

interface PhysicsLessonPlanPreviewProps {
  plan: PhysicsLessonPlanDoc;
}

export const PhysicsLessonPlanPreview = forwardRef<
  HTMLDivElement,
  PhysicsLessonPlanPreviewProps
>(function PhysicsLessonPlanPreview({ plan }, ref) {
  const localRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

  useEffect(() => {
    const root = localRef.current;
    if (!root) return;
    root.innerHTML = buildPhysicsLessonPlanHtml(plan);
    const doc = root.querySelector(".physics-lesson-plan-doc");
    if (doc instanceof HTMLElement) {
      // Wait a frame so layout/fonts settle before measuring blocks.
      const id = requestAnimationFrame(() => {
        paginatePhysicsLessonPlan(doc);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [plan]);

  return (
    <div
      ref={localRef}
      className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-100 p-4"
    />
  );
});
