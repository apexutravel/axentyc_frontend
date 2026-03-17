"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Image as ImageIcon,
  Code,
  Undo2,
  Redo2,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: updatedEditor }: { editor: any }) => {
      onChange(updatedEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[250px] px-5 py-4",
        "data-placeholder": placeholder || "Escribe tu mensaje...",
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt("URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt("Image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const ToolBtn = ({ active, onPress, children, title }: { active?: boolean; onPress: () => void; children: React.ReactNode; title?: string }) => (
    <button
      type="button"
      title={title}
      onClick={onPress}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
        active
          ? "bg-primary/15 text-primary"
          : "text-default-500 hover:bg-default-100 hover:text-default-700"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b border-divider bg-default-50/50">
        <ToolBtn active={editor.isActive("bold")} onPress={() => editor.chain().focus().toggleBold().run()} title="Negrita">
          <Bold size={15} />
        </ToolBtn>
        <ToolBtn active={editor.isActive("italic")} onPress={() => editor.chain().focus().toggleItalic().run()} title="Cursiva">
          <Italic size={15} />
        </ToolBtn>
        <ToolBtn active={editor.isActive("underline")} onPress={() => editor.chain().focus().toggleUnderline().run()} title="Subrayado">
          <UnderlineIcon size={15} />
        </ToolBtn>
        <ToolBtn active={editor.isActive("strike")} onPress={() => editor.chain().focus().toggleStrike().run()} title="Tachado">
          <Strikethrough size={15} />
        </ToolBtn>

        <div className="w-px h-5 bg-divider mx-1.5" />

        <ToolBtn active={editor.isActive("bulletList")} onPress={() => editor.chain().focus().toggleBulletList().run()} title="Lista">
          <List size={15} />
        </ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onPress={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
          <ListOrdered size={15} />
        </ToolBtn>

        <div className="w-px h-5 bg-divider mx-1.5" />

        <ToolBtn active={editor.isActive({ textAlign: "left" })} onPress={() => editor.chain().focus().setTextAlign("left").run()} title="Alinear izquierda">
          <AlignLeft size={15} />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "center" })} onPress={() => editor.chain().focus().setTextAlign("center").run()} title="Centrar">
          <AlignCenter size={15} />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "right" })} onPress={() => editor.chain().focus().setTextAlign("right").run()} title="Alinear derecha">
          <AlignRight size={15} />
        </ToolBtn>

        <div className="w-px h-5 bg-divider mx-1.5" />

        <ToolBtn active={editor.isActive("link")} onPress={addLink} title="Enlace">
          <Link2 size={15} />
        </ToolBtn>
        <ToolBtn onPress={addImage} title="Imagen">
          <ImageIcon size={15} />
        </ToolBtn>
        <ToolBtn active={editor.isActive("code")} onPress={() => editor.chain().focus().toggleCode().run()} title="Código">
          <Code size={15} />
        </ToolBtn>

        <div className="w-px h-5 bg-divider mx-1.5" />

        <ToolBtn onPress={() => editor.chain().focus().undo().run()} title="Deshacer">
          <Undo2 size={15} />
        </ToolBtn>
        <ToolBtn onPress={() => editor.chain().focus().redo().run()} title="Rehacer">
          <Redo2 size={15} />
        </ToolBtn>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      <style jsx global>{`
        .ProseMirror { outline: none; }
        .ProseMirror.is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--heroui-default-400, 240 4% 46%));
          pointer-events: none;
          height: 0;
          opacity: 0.6;
        }
        .ProseMirror > p:first-child:only-child:empty::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--heroui-default-400, 240 4% 46%));
          pointer-events: none;
          height: 0;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
