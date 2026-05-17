// Local expense store synced with Dashboard via custom event.
export type ExpenseEntry = {
  id: string;
  name: string;
  amount: number;
  category: string;
  source: "whatsapp" | "manual";
  createdAt: number;
};

const KEY = "organizze.expenses";

export const readExpenses = (): ExpenseEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export const addExpenses = (items: ExpenseEntry[]) => {
  const current = readExpenses();
  const next = [...current, ...items];
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent("organizze:expenses-updated", {
      detail: { added: items, source: items[0]?.source ?? "manual" },
    })
  );
};

export const fileToCompressedBase64 = (file: File, maxWidth = 1280): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
