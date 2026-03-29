import type { ReactNode } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Heading2, Undo2, Redo2 } from 'lucide-react';

interface ChecklistRichDescriptionEditorProps {
  /** Remount when this changes (new vs edit, or fresh add). */
  mountKey: string;
  initialHtml: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

export function ChecklistRichDescriptionEditor({
  mountKey,
  initialHtml,
  onChange,
  disabled,
}: ChecklistRichDescriptionEditorProps) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
        }),
        Placeholder.configure({
          placeholder: 'What does this mean to you both? Add warmth, detail, or a shared vision…',
        }),
      ],
      content: initialHtml || '<p></p>',
      editable: !disabled,
      immediatelyRender: false,
      onUpdate: ({ editor: ed }) => {
        onChange(ed.getHTML());
      },
    },
    [mountKey]
  );

  if (!editor) {
    return (
      <div className="checklist-rich-editor min-h-[140px] rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 animate-pulse" />
    );
  }

  return (
    <div className="checklist-rich-editor rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden">
      {!disabled && (
        <div
          className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[var(--border)] bg-[var(--surface-raised)]/30"
          role="toolbar"
          aria-label="Formatting"
        >
          <ToolbarIcon
            label="Bold"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={16} strokeWidth={2.5} />
          </ToolbarIcon>
          <ToolbarIcon
            label="Italic"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={16} strokeWidth={2.5} />
          </ToolbarIcon>
          <ToolbarIcon
            label="Heading"
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 size={16} strokeWidth={2.5} />
          </ToolbarIcon>
          <ToolbarIcon
            label="Bullet list"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={16} strokeWidth={2.5} />
          </ToolbarIcon>
          <ToolbarIcon
            label="Numbered list"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={16} strokeWidth={2.5} />
          </ToolbarIcon>
          <span className="w-px h-5 bg-[var(--border)] mx-1" aria-hidden />
          <ToolbarIcon label="Undo" onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 size={16} strokeWidth={2.5} />
          </ToolbarIcon>
          <ToolbarIcon label="Redo" onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 size={16} strokeWidth={2.5} />
          </ToolbarIcon>
        </div>
      )}
      <EditorContent editor={editor} className="checklist-rich-content px-3 py-2 min-h-[140px] max-h-[min(50vh,320px)] overflow-y-auto" />
    </div>
  );
}

function ToolbarIcon({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${
        active
          ? 'bg-[color-mix(in_srgb,var(--accent-a)_28%,transparent)] text-[var(--accent-a)]'
          : 'text-[var(--text-dim)] hover:bg-[var(--surface-raised)]/60 hover:text-[var(--text)]'
      }`}
    >
      {children}
    </button>
  );
}
