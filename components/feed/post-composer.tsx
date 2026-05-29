"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { useUser } from "@/components/shared/user-context";
import {
  IconArticle,
  IconCamera,
  IconPhoto,
  IconStethoscope,
  IconX,
} from "@tabler/icons-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PHOTO_CAPTION_MAX, POST_TEXT_MAX } from "@/lib/validations";

type PostTag = "Case Study" | "Article" | "Update" | "Photo";
type ComposerMode = "idle" | "photo" | "article" | "case" | "update";

interface PostComposerProps {
  onPosted?: () => void;
}

export function PostComposer({ onPosted }: PostComposerProps) {
  const user = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ComposerMode>("idle");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const isTextMode = mode === "article" || mode === "case" || mode === "update";
  const isPhotoMode = mode === "photo";
  const expanded = mode !== "idle";

  const tag: PostTag =
    mode === "photo"
      ? "Photo"
      : mode === "article"
        ? "Article"
        : mode === "case"
          ? "Case Study"
          : "Update";

  const textLimit = isPhotoMode ? PHOTO_CAPTION_MAX : POST_TEXT_MAX;

  const resetComposer = () => {
    setBody("");
    setImageUrl("");
    setImagePreview("");
    setMode("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openPhotoPicker = () => {
    setMode("photo");
    setBody("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const openTextMode = (next: "article" | "case") => {
    setImageUrl("");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setBody("");
    setMode(next);
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG, PNG, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      try {
        const res = await fetch("/api/upload/photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, purpose: "post" }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? "Failed to upload image");
          setImagePreview("");
          setImageUrl("");
          return;
        }
        const url = json.url ?? base64;
        setImageUrl(url);
        setImagePreview(url);
        setMode("photo");
      } catch {
        toast.error("Failed to upload image");
        setImagePreview("");
        setImageUrl("");
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      toast.error("Could not read image");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    } else if (mode === "photo" && !imageUrl && !uploading) {
      setMode("idle");
    }
  };

  const removeImage = () => {
    setImageUrl("");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBodyChange = (value: string) => {
    if (value.length <= textLimit) setBody(value);
  };

  const submit = async () => {
    const text = body.trim();

    if (tag === "Photo" && !imageUrl) {
      toast.error("Choose a photo from your device first");
      fileInputRef.current?.click();
      return;
    }

    if (tag !== "Photo" && !text) {
      toast.error("Write something to post");
      return;
    }

    if (body.length > textLimit) {
      toast.error(`Maximum ${textLimit} characters`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: tag === "Photo" && !text ? "Shared a photo" : text,
          tag,
          imageUrl: tag === "Photo" ? imageUrl : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const err = json.error;
        if (typeof err === "string") {
          toast.error(err);
        } else if (err && typeof err === "object") {
          const msg = Object.values(err).flat().filter(Boolean).join(". ");
          toast.error(msg || "Failed to create post");
        } else {
          toast.error("Failed to create post");
        }
        return;
      }
      toast.success("Posted — visible to all RIDA members");
      resetComposer();
      onPosted?.();
    } catch {
      toast.error("Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feed-card">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onFileChange}
      />

      <div className="flex items-start gap-2 px-3 py-3">
        <UserAvatar
          name={user?.fullName ?? "You"}
          src={user?.profilePhoto}
          size={48}
          className="border border-[#d6cec4]"
        />
        <div className="min-w-0 flex-1">
          {!expanded ? (
            <button
              type="button"
              onClick={() => setMode("update")}
              className="w-full rounded-full border border-[#d6cec4] px-4 py-2.5 text-left text-sm font-semibold text-text-muted transition-colors hover:bg-[#f8f6f1]"
            >
              Start a post
            </button>
          ) : isPhotoMode ? (
            <PhotoComposerPanel
              imagePreview={imagePreview}
              uploading={uploading}
              body={body}
              captionMax={PHOTO_CAPTION_MAX}
              onCaptionChange={handleBodyChange}
              onRemoveImage={removeImage}
              onChooseAnother={() => fileInputRef.current?.click()}
            />
          ) : isTextMode ? (
            <TextComposerPanel
              mode={mode}
              body={body}
              maxLength={POST_TEXT_MAX}
              onChange={handleBodyChange}
            />
          ) : null}
        </div>
      </div>

      {expanded && (
        <div className="flex justify-end gap-2 border-t border-[#ebe6dc] px-3 py-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting || uploading}
            onClick={resetComposer}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={
              submitting ||
              uploading ||
              (isPhotoMode && !imageUrl) ||
              (isTextMode && !body.trim())
            }
            onClick={submit}
          >
            {submitting ? "Posting…" : "Post"}
          </Button>
        </div>
      )}

      <div className="flex border-t border-[#ebe6dc] px-1 py-1">
        <ComposerAction
          icon={IconCamera}
          label="Photo"
          active={mode === "photo"}
          disabled={uploading}
          onClick={openPhotoPicker}
        />
        <ComposerAction
          icon={IconArticle}
          label="Article"
          active={mode === "article"}
          onClick={() => openTextMode("article")}
        />
        <ComposerAction
          icon={IconStethoscope}
          label="Case study"
          active={mode === "case"}
          onClick={() => openTextMode("case")}
        />
      </div>
    </div>
  );
}

function PhotoComposerPanel({
  imagePreview,
  uploading,
  body,
  captionMax,
  onCaptionChange,
  onRemoveImage,
  onChooseAnother,
}: {
  imagePreview: string;
  uploading: boolean;
  body: string;
  captionMax: number;
  onCaptionChange: (v: string) => void;
  onRemoveImage: () => void;
  onChooseAnother: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex rounded-full bg-[#ede8fc] px-2.5 py-0.5 text-[10px] font-bold text-[#5a4a8a]">
          Photo
        </span>
        <span className="text-[10px] text-text-muted">
          Visible to all RIDA members
        </span>
      </div>

      {!imagePreview && !uploading ? (
        <button
          type="button"
          onClick={onChooseAnother}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#d6cec4] bg-[#f8f6f1] py-10 transition-colors hover:border-green-primary hover:bg-green-pale"
        >
          <IconPhoto size={32} className="text-green-primary" stroke={1.5} />
          <span className="text-sm font-semibold text-text-dark">
            Choose photo from device
          </span>
          <span className="text-[11px] text-text-muted">JPG, PNG, WEBP up to 5 MB</span>
        </button>
      ) : (
        <div className="relative overflow-hidden rounded-lg border border-[#d6cec4]">
          {uploading ? (
            <div className="flex h-48 items-center justify-center bg-[#f8f6f1] text-sm text-text-muted">
              Uploading…
            </div>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Selected"
                className="max-h-72 w-full object-contain bg-[#f8f6f1]"
              />
              <button
                type="button"
                onClick={onRemoveImage}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                aria-label="Remove photo"
              >
                <IconX size={16} />
              </button>
            </>
          )}
        </div>
      )}

      {imagePreview && !uploading && (
        <button
          type="button"
          onClick={onChooseAnother}
          className="text-xs font-semibold text-green-primary hover:underline"
        >
          Change photo
        </button>
      )}

      <div>
        <label className="mb-1 block text-[11px] font-semibold text-text-muted">
          Caption (optional)
        </label>
        <textarea
          value={body}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Add a caption…"
          rows={2}
          maxLength={captionMax}
          className="w-full resize-none rounded-lg border border-[#d6cec4] bg-white px-3 py-2.5 text-sm text-text-dark outline-none focus:border-green-primary"
        />
        <CharCount current={body.length} max={captionMax} />
      </div>
    </div>
  );
}

function TextComposerPanel({
  mode,
  body,
  maxLength,
  onChange,
}: {
  mode: "article" | "case" | "update";
  body: string;
  maxLength: number;
  onChange: (v: string) => void;
}) {
  const isArticle = mode === "article";
  const isCase = mode === "case";

  const title = isArticle ? "Article" : isCase ? "Case study" : "Update";
  const placeholder = isArticle
    ? "Write your article — title, summary, key points, or links…"
    : isCase
      ? "Describe the case: presentation, findings, diagnosis, and learning points…"
      : "What do you want to talk about?";

  const badgeClass = isArticle
    ? "bg-[#dde8fc] text-[#2d4a8a]"
    : isCase
      ? "bg-green-light text-green-primary"
      : "bg-[#fde8d0] text-[#8a5a30]";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold",
            badgeClass
          )}
        >
          {title}
        </span>
        <span className="text-[10px] text-text-muted">
          Visible to all RIDA members · max {maxLength} characters
        </span>
      </div>
      <textarea
        value={body}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={8}
        maxLength={maxLength}
        autoFocus
        className="w-full resize-y rounded-lg border border-[#d6cec4] bg-white px-3 py-2.5 text-sm leading-relaxed text-text-dark outline-none focus:border-green-primary"
      />
      <CharCount current={body.length} max={maxLength} />
    </div>
  );
}

function CharCount({ current, max }: { current: number; max: number }) {
  const nearLimit = current > max * 0.9;
  return (
    <p
      className={cn(
        "mt-1 text-right text-[10px]",
        nearLimit ? "font-semibold text-[#c0392b]" : "text-text-muted"
      )}
    >
      {current} / {max}
    </p>
  );
}

function ComposerAction({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: typeof IconCamera;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-md py-3 text-xs font-semibold transition-colors disabled:opacity-50",
        active
          ? "bg-green-pale text-green-primary"
          : "text-text-muted hover:bg-[#f8f6f1]"
      )}
    >
      <Icon size={20} stroke={1.5} />
      {label}
    </button>
  );
}
