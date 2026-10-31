import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  buildPhysicsLessonPlanHtml,
  PHYSICS_LESSON_PLAN_A4_HEIGHT_PX,
  PHYSICS_LESSON_PLAN_A4_WIDTH_PX,
  PHYSICS_LESSON_PLAN_PAGE_PADDING_PX,
  type PhysicsLessonPlanDoc,
} from "./physics-lesson-plan-html";

/** Keep scale 2 for crisp Greek text; JPEG keeps clarity with much smaller files than PNG. */
const RENDER_SCALE = 2;
const JPEG_QUALITY = 0.92;

function findPhysicsLessonPlanElement(root: ParentNode): HTMLElement {
  const element = root.querySelector(".physics-lesson-plan-doc");
  if (!element) {
    throw new Error("Physics lesson plan preview element not found");
  }
  return element as HTMLElement;
}

function contentMaxHeightPx(): number {
  return (
    PHYSICS_LESSON_PLAN_A4_HEIGHT_PX - PHYSICS_LESSON_PLAN_PAGE_PADDING_PX * 2 - 18
  );
}

/**
 * Pack whole `.plan-block` sections into fixed A4 pages so topics
 * (e.g. homework) are never split mid-section across a page break.
 */
export function paginatePhysicsLessonPlan(doc: HTMLElement): void {
  if (doc.dataset.paginated === "true") return;

  const source = doc.querySelector(".plan-source");
  const pagesHostEl = doc.querySelector(".plan-pages");
  if (!source || !pagesHostEl) {
    throw new Error("Physics lesson plan pagination containers missing");
  }
  const pagesHost = pagesHostEl;

  const blocks = Array.from(source.querySelectorAll<HTMLElement>(".plan-block"));
  (source as HTMLElement).style.display = "none";
  pagesHost.innerHTML = "";

  const maxHeight = contentMaxHeightPx();
  let pageIndex = 0;
  let currentPage: HTMLElement | null = null;
  let currentInner: HTMLElement | null = null;
  let usedHeight = 0;

  function startPage() {
    pageIndex += 1;
    currentPage = document.createElement("div");
    currentPage.className = "plan-page";
    currentPage.dataset.page = String(pageIndex);

    currentInner = document.createElement("div");
    currentInner.className = "plan-page-inner";
    currentPage.appendChild(currentInner);

    const pageNumber = document.createElement("div");
    pageNumber.className = "page-number";
    pageNumber.textContent = `σελ. ${pageIndex}`;
    currentPage.appendChild(pageNumber);

    pagesHost.appendChild(currentPage);
    usedHeight = 0;
  }

  startPage();

  for (const block of blocks) {
    const clone = block.cloneNode(true) as HTMLElement;
    currentInner!.appendChild(clone);
    const blockHeight = clone.getBoundingClientRect().height;

    const fits = usedHeight === 0 || usedHeight + blockHeight <= maxHeight + 0.5;
    if (!fits) {
      currentInner!.removeChild(clone);
      startPage();
      currentInner!.appendChild(clone);
      usedHeight = clone.getBoundingClientRect().height;
    } else {
      usedHeight += blockHeight;
    }
  }

  doc.dataset.paginated = "true";

  const total = pageIndex;
  pagesHost.querySelectorAll(".page-number").forEach((node, index) => {
    node.textContent = `σελ. ${index + 1} / ${total}`;
  });
}

async function canvasForPage(page: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(page, {
    scale: RENDER_SCALE,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    width: PHYSICS_LESSON_PLAN_A4_WIDTH_PX,
    height: PHYSICS_LESSON_PLAN_A4_HEIGHT_PX,
    windowWidth: PHYSICS_LESSON_PLAN_A4_WIDTH_PX,
  });
}

async function renderPhysicsLessonPlanPdf(element: HTMLElement): Promise<jsPDF> {
  paginatePhysicsLessonPlan(element);

  const pages = Array.from(
    element.querySelectorAll<HTMLElement>(".plan-page")
  );
  if (pages.length === 0) {
    throw new Error("No A4 pages were created for the lesson plan");
  }

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i += 1) {
    const canvas = await canvasForPage(pages[i]);
    // JPEG at high quality keeps Greek text clear and avoids multi‑MB PNGs.
    const imgData = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    if (i > 0) pdf.addPage("a4", "portrait");
    pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, pageHeight);
  }

  return pdf;
}

function mountOffscreenHtml(html: string): HTMLDivElement {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = `${PHYSICS_LESSON_PLAN_A4_WIDTH_PX}px`;
  container.style.zIndex = "-1";
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  container.style.overflow = "visible";
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

export async function generatePhysicsLessonPlanPdf(
  plan: PhysicsLessonPlanDoc
): Promise<jsPDF> {
  const container = mountOffscreenHtml(buildPhysicsLessonPlanHtml(plan));
  try {
    return await renderPhysicsLessonPlanPdf(
      findPhysicsLessonPlanElement(container)
    );
  } finally {
    document.body.removeChild(container);
  }
}

export async function generatePhysicsLessonPlanPdfFromElement(
  root: HTMLElement
): Promise<jsPDF> {
  return renderPhysicsLessonPlanPdf(findPhysicsLessonPlanElement(root));
}

export async function downloadPhysicsLessonPlanPdf(
  plan: PhysicsLessonPlanDoc,
  filename = "sxedio-mathimatos-fysiki"
): Promise<void> {
  const doc = await generatePhysicsLessonPlanPdf(plan);
  doc.save(`${filename}.pdf`);
}

export async function getPhysicsLessonPlanPdfBlobUrl(
  plan: PhysicsLessonPlanDoc
): Promise<string> {
  const doc = await generatePhysicsLessonPlanPdf(plan);
  return URL.createObjectURL(doc.output("blob"));
}

export async function getPhysicsLessonPlanPdfBlobUrlFromElement(
  root: HTMLElement
): Promise<string> {
  const doc = await generatePhysicsLessonPlanPdfFromElement(root);
  return URL.createObjectURL(doc.output("blob"));
}
