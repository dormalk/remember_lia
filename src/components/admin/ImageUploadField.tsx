"use client";

interface ImageUploadFieldProps {
  label: string;
  currentUrl: string;
  previewUrl: string | null;
  disabled?: boolean;
  onFileReady: (file: File, previewUrl: string) => void;
  onClear: () => void;
}

export function ImageUploadField({
  label,
  currentUrl,
  previewUrl,
  disabled,
  onFileReady,
  onClear,
}: ImageUploadFieldProps) {
  const displayUrl = previewUrl ?? currentUrl;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    onFileReady(file, URL.createObjectURL(file));
    // Reset input so selecting the same file again triggers onChange
    event.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-start gap-4">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.03]">
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt=""
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-foreground/40">
              אין תמונה
            </div>
          )}
        </div>
        {!disabled ? (
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer rounded-lg border border-foreground/20 px-3 py-2 text-sm transition hover:bg-foreground/5">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleChange}
                disabled={disabled}
              />
              בחר תמונה
            </label>
            {displayUrl ? (
              <button
                type="button"
                onClick={onClear}
                className="rounded-lg border border-foreground/20 px-3 py-2 text-sm text-foreground/60 transition hover:bg-foreground/5 hover:text-foreground"
              >
                הסר תמונה
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {previewUrl ? (
        <p className="text-xs text-foreground/50">תמונה חדשה נבחרה — תישמר עם לחיצה על שמור</p>
      ) : null}
    </div>
  );
}
