/**
 * Turns the routine pictures into a PDF, in the browser.
 *
 * The pages are images, so nothing has to be typeset — no font is embedded and
 * no text is re-drawn, which is why this can stay a client-side job. Each
 * picture keeps its own aspect ratio: the page is sized to the image so a tall
 * timetable is not squashed onto a landscape sheet.
 */
import { jsPDF } from "jspdf";

/** A4 in millimetres, used only when an image's size cannot be read. */
const A4 = { width: 210, height: 297 };
/** A little breathing room so the page edge never crops the picture. */
const MARGIN = 6;

interface LoadedImage {
  readonly dataUrl: string;
  readonly width: number;
  readonly height: number;
}

/**
 * Reads one image into a data URL.
 *
 * `crossOrigin` matters: without it the browser taints the canvas and the
 * export throws. Hosts that refuse cross-origin reads are reported by name so
 * the message can say which page failed rather than just "download failed".
 */
function loadImage(url: string): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      try {
        const context = canvas.getContext("2d");
        if (!context) throw new Error("ক্যানভাস পাওয়া যায়নি");
        context.drawImage(image, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/jpeg", 0.92),
          width: canvas.width,
          height: canvas.height,
        });
      } catch {
        reject(new Error("ছবিটি পড়া যায়নি"));
      }
    };
    image.onerror = () => reject(new Error("ছবি লোড হয়নি"));
    image.src = url;
  });
}

/**
 * Builds the PDF and hands it to the browser.
 *
 * One image per page, in the given order. A caption, when present, is skipped —
 * adding text would need an embedded Bangla font, and the picture already
 * carries everything.
 */
export async function buildRoutinePdf(
  pages: readonly { readonly imageUrl: string }[],
  fileName: string,
): Promise<
  { readonly ok: true } | { readonly ok: false; readonly error: string }
> {
  if (pages.length === 0) {
    return { ok: false, error: "এই কোর্সে এখনো কোনো রুটিন ছবি যোগ করা হয়নি।" };
  }

  const loaded: LoadedImage[] = [];
  for (const [index, page] of pages.entries()) {
    try {
      loaded.push(await loadImage(page.imageUrl));
    } catch {
      return {
        ok: false,
        error: `${index + 1} নম্বর ছবিটি ডাউনলোড করা যায়নি। সব ছবি সরাসরি (রিডাইরেক্ট) লিংক হতে হবে।`,
      };
    }
  }

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  for (const [index, image] of loaded.entries()) {
    const first = index === 0;
    if (!first) pdf.addPage();

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - MARGIN * 2;
    const maxHeight = pageHeight - MARGIN * 2;

    const ratio = image.height / image.width;
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
    const width = image.width * scale;
    const height = image.height * scale;

    pdf.addImage(
      image.dataUrl,
      "JPEG",
      (pageWidth - width) / 2,
      MARGIN,
      width,
      height,
      undefined,
      "FAST",
    );
  }

  pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
  return { ok: true };
}
