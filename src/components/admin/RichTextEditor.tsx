"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";

function ToolbarButton({
  onClick,
  active,
  label,
  children,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={`rounded px-2 py-1 text-sm transition ${
        active
          ? "bg-foreground text-background"
          : "text-foreground/70 hover:bg-foreground/10"
      } disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, disabled }: { editor: Editor | null; disabled?: boolean }) {
  if (!editor) return null;

  function setLink() {
    if (!editor) return;
    const url = window.prompt("הזן כתובת קישור:", editor.getAttributes("link").href ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank" }).run();
  }

  return (
    <div className="flex flex-wrap gap-1 border-b border-foreground/10 pb-2">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        label="מודגש"
        disabled={disabled}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        label="נטוי"
        disabled={disabled}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        label="קו תחתי"
        disabled={disabled}
      >
        <span className="underline">U</span>
      </ToolbarButton>
      <span className="mx-1 text-foreground/20">|</span>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        label="כותרת 1"
        disabled={disabled}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        label="כותרת 2"
        disabled={disabled}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        label="כותרת 3"
        disabled={disabled}
      >
        H3
      </ToolbarButton>
      <span className="mx-1 text-foreground/20">|</span>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        label="רשימה"
        disabled={disabled}
      >
        ≡
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        label="רשימה ממוספרת"
        disabled={disabled}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        label="ציטוט"
        disabled={disabled}
      >
        {'"'}
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        active={false}
        label="קו מפריד"
        disabled={disabled}
      >
        —
      </ToolbarButton>
      <ToolbarButton
        onClick={setLink}
        active={editor.isActive("link")}
        label="קישור"
        disabled={disabled}
      >
        🔗
      </ToolbarButton>
    </div>
  );
}

interface RichTextEditorProps {
  story: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

export function RichTextEditor({ story, onChange, disabled }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Underline,
    ],
    content: story,
    editable: !disabled,
    editorProps: {
      attributes: {
        dir: "rtl",
        class:
          "min-h-[12rem] rounded-b-lg border border-t-0 border-foreground/20 bg-background px-3 py-2 text-base outline-none focus:border-foreground/50 focus:ring-2 focus:ring-foreground/10",
      },
    },
    onUpdate({ editor: e }) {
      onChange(e.getHTML());
    },
  });

  // Sync when parent refreshes content (e.g. after router.refresh())
  useEffect(() => {
    if (editor && !editor.isDestroyed && editor.getHTML() !== story) {
      editor.commands.setContent(story, { emitUpdate: false });
    }
  }, [editor, story]);

  // Keep editable state in sync with disabled prop
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  if (!editor) {
    return (
      <div className="min-h-[12rem] rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground/40">
        טוען עורך...
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="rounded-t-lg border border-foreground/20 bg-foreground/[0.03] px-2 py-2">
        <Toolbar editor={editor} disabled={disabled} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
