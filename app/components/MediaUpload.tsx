"use client";

import { ChangeEvent, DragEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

type MediaUploadProps = {
  name: string;
  initialUrl?: string;
  onChange?: (url: string) => void;
  onUploadStateChange?: (uploading: boolean) => void;
};

export default function MediaUpload({ name, initialUrl = "", onChange, onUploadStateChange }: MediaUploadProps) {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  async function uploadFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Images must be smaller than 5MB.");
      return;
    }

    setError("");
    setUploading(true);
    onUploadStateChange?.(true);
    
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `products/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("images").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      onUploadStateChange?.(false);
      return;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(path);
    setUrl(data.publicUrl);
    onChange?.(data.publicUrl);
    setUploading(false);
    onUploadStateChange?.(false);
  }

  function upload(event: ChangeEvent<HTMLInputElement>) {
    void uploadFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(false);
    void uploadFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="media-upload">
      <span className="media-upload-label">Fragrance portrait</span>
      <input type="hidden" name={name} value={url} />
      <label
        className={`media-dropzone ${url ? "has-image" : ""} ${dragActive ? "drag-active" : ""}`}
        onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (event.currentTarget === event.target) setDragActive(false); }}
        onDrop={handleDrop}
      >
        {url ? <span className="media-preview" style={{ backgroundImage: `url("${url}")` }} /> : <span className="media-placeholder">◇</span>}
        <span className="media-copy">
          <strong>{uploading ? "Uploading image..." : dragActive ? "Drop to upload" : url ? "Replace product image" : "Drop product image here"}</strong>
          <small>{dragActive ? "Release to upload to your media library" : "or click to browse · PNG, JPG or WEBP · max 5MB"}</small>
        </span>
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} disabled={uploading} />
      </label>
      {error && <span className="media-error" role="alert">{error}</span>}
    </div>
  );
}
