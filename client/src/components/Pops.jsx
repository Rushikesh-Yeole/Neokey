import { useState, useEffect } from "react";

export default function Pops() {
  const [popup, setPopup] = useState({
    open: false,
    title: "",
    body: "",
    primaryLabel: "OK",
    onPrimary: null,
    secondaryLabel: null,
    onSecondary: null,
  });

  useEffect(() => {
    // Global function to open any styled popup
    window.showPopup = ({
      title,
      body,
      primaryLabel,
      onPrimary,
      secondaryLabel,
      onSecondary,
    } = {}) => {
      setPopup({
        open: true,
        title: title || "Notice",
        body: body || "",
        primaryLabel: primaryLabel || "OK",
        onPrimary:
          onPrimary ||
          (() => setPopup((prev) => ({ ...prev, open: false }))),
        secondaryLabel: secondaryLabel || null,
        onSecondary:
          onSecondary ||
          (() => setPopup((prev) => ({ ...prev, open: false }))),
      });
    };
  }, []);

  if (!popup.open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4" onClick={() => setPopup(prev => ({ ...prev, open: false }))}>
      <div
        className="glass-container px-4 rounded-2xl shadow-glass w-full max-w-max sm:max-w-sm text-slate-200 text-sm sm:text-base"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl sm:text-3xl font-bold mt-4 mb-4 text-center">{popup.title}</h3>
        <div className="text-sm sm:text-base text-gray-100 mb-6 text-center">{popup.body}</div>

        <div className="flex justify-between gap-2 mb-3">
          {popup.secondaryLabel && (
            <button
              className="flex-1 px-4 py-2 rounded-full border border-white hover:bg-white hover:text-slate-900 transition-colors"
              onClick={popup.onSecondary}
            >
              {popup.secondaryLabel}
            </button>
          )}
          <button
            className="mx-auto block px-[10%] py-2 rounded-full border border-[#00f9ff] bg-gradient-to-br from-sky-700 to-blue-950 text-white hover:opacity-90 transition"
            onClick={popup.onPrimary}
          >
            {popup.primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
