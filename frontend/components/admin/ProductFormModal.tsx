"use client";

import * as React from "react";
import {
  FolderPlus,
  Upload,
  Link2,
  X,
  Star,
  ImagePlus,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface AdminProduct {
  id: number;
  title: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category_id: number;
  image_url?: string | null;
  images?: Array<{ id: number; image_url: string; display_order: number }>;
  category?: { name: string };
}

interface Category {
  id: number;
  name: string;
}

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  editingProduct: AdminProduct | null;
  categories: Category[];
  onSaved: () => void;
  onCategoryCreated: () => void;
}

async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image file"));
      img.onload = () => {
        const maxDim = 900;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProductFormModal({
  open,
  onClose,
  editingProduct,
  categories,
  onSaved,
  onCategoryCreated,
}: ProductFormModalProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = React.useState(false);
  const [creatingCat, setCreatingCat] = React.useState(false);
  const [showNewCat, setShowNewCat] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState("");
  const [newCatDesc, setNewCatDesc] = React.useState("");

  const [urlInput, setUrlInput] = React.useState("");
  const [images, setImages] = React.useState<string[]>([]);
  const [processingFiles, setProcessingFiles] = React.useState(false);

  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    price: "",
    stock_quantity: "",
    category_id: "",
  });

  React.useEffect(() => {
    if (editingProduct) {
      setFormData({
        title: editingProduct.title,
        description: editingProduct.description || "",
        price: editingProduct.price.toString(),
        stock_quantity: editingProduct.stock_quantity.toString(),
        category_id: editingProduct.category_id.toString(),
      });
      const existingImgs =
        editingProduct.images && editingProduct.images.length > 0
          ? editingProduct.images.map((i) => i.image_url)
          : editingProduct.image_url
          ? [editingProduct.image_url]
          : [];
      setImages(existingImgs);
    } else {
      setFormData({
        title: "",
        description: "",
        price: "",
        stock_quantity: "",
        category_id: categories[0]?.id?.toString() || "",
      });
      setImages([]);
    }
    setUrlInput("");
    setShowNewCat(false);
    setNewCatName("");
    setNewCatDesc("");
  }, [editingProduct, categories, open]);

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setProcessingFiles(true);
    try {
      const encoded = await Promise.all(files.map(compressImageFile));
      setImages((prev) => [...prev, ...encoded].slice(0, 8));
      toast({
        type: "success",
        title: "Photos added",
        description: `Uploaded ${encoded.length} product photo(s).`,
      });
    } catch {
      toast({
        type: "error",
        title: "Upload failed",
        description: "One or more selected files could not be processed.",
      });
    } finally {
      setProcessingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setImages((prev) => [...prev, trimmed].slice(0, 8));
    setUrlInput("");
  };

  const handleSetPrimary = (idx: number) => {
    if (idx === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [picked] = next.splice(idx, 1);
      return [picked, ...next];
    });
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      const created = await apiRequest<Category>("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim() || undefined,
        }),
      });
      setFormData((prev) => ({
        ...prev,
        category_id: created.id.toString(),
      }));
      setNewCatName("");
      setNewCatDesc("");
      setShowNewCat(false);
      onCategoryCreated();
      toast({
        type: "success",
        title: "Category created",
        description: `"${created.name}" is now available.`,
      });
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Could not create category",
        description: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setCreatingCat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity, 10),
      category_id: parseInt(formData.category_id, 10),
      image_url: images[0] || undefined,
      images,
    };

    try {
      if (editingProduct) {
        await apiRequest(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast({
          type: "success",
          title: "Product updated",
          description: `"${payload.title}" changes saved.`,
        });
      } else {
        await apiRequest("/api/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast({
          type: "success",
          title: "Product created",
          description: `"${payload.title}" added to live catalog.`,
        });
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Save failed",
        description: err instanceof Error ? err.message : "Please check inputs.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingProduct ? "Edit Product" : "Add New Product"}
      description={
        editingProduct
          ? `Updating SKU-${editingProduct.id}`
          : "Publish a new item with multiple product photos."
      }
      maxWidthClass="max-w-2xl"
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[75vh] overflow-y-auto pr-1 space-y-4"
      >
        <Input
          label="Product Title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g. Mechanical Keyboard"
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-700">
            Description
          </label>
          <textarea
            required
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Product features and specifications..."
            className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:text-zinc-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Price (₹)"
            required
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            placeholder="2999"
          />
          <Input
            label="Stock Quantity"
            required
            type="number"
            min="0"
            value={formData.stock_quantity}
            onChange={(e) =>
              setFormData({ ...formData, stock_quantity: e.target.value })
            }
            placeholder="25"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-zinc-700">
              Category
            </label>
            <button
              type="button"
              onClick={() => setShowNewCat((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
            >
              <FolderPlus className="h-3 w-3" />
              {showNewCat ? "Cancel" : "New Category"}
            </button>
          </div>

          {showNewCat ? (
            <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category name (e.g. Wearables)"
                  className="h-9 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-xs focus:border-zinc-900 focus:outline-none"
                />
                <Button
                  type="button"
                  size="md"
                  variant="secondary"
                  isLoading={creatingCat}
                  onClick={handleCreateCategory}
                >
                  Create
                </Button>
              </div>
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Short description (optional)"
                className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-3 text-xs focus:border-zinc-900 focus:outline-none"
              />
            </div>
          ) : (
            <select
              required
              value={formData.category_id}
              onChange={(e) =>
                setFormData({ ...formData, category_id: e.target.value })
              }
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:text-zinc-100"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Multi-Photo Upload & URL Manager */}
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-zinc-900">
                Product Photos ({images.length}/8)
              </p>
              <p className="text-[11px] text-zinc-500">
                Upload multiple images or paste URLs. First photo is primary.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              isLoading={processingFiles}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Photos
            </Button>
          </div>

          {/* Add Photo by URL */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddUrl();
                  }
                }}
                placeholder="Or paste an image URL (https://...) and click Add"
                className="h-8 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:text-zinc-100"
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleAddUrl}
              disabled={!urlInput.trim() || images.length >= 8}
            >
              Add URL
            </Button>
          </div>

          {/* Thumbnail Grid */}
          {images.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white py-6 text-center hover:border-zinc-400 transition-colors dark:border-zinc-700"
            >
              <ImagePlus className="h-6 w-6 text-zinc-400" />
              <p className="mt-1.5 text-xs font-medium text-zinc-600">
                Click to select one or more product photos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {images.map((imgSrc, idx) => (
                <div
                  key={`${idx}-${imgSrc.slice(0, 24)}`}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-white"
                >
                  <img
                    src={imgSrc}
                    alt={`Photo ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {idx === 0 ? (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-zinc-950/85 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Primary
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(idx)}
                      title="Set as primary photo"
                      className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded bg-zinc-950/75 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Star className="h-2.5 w-2.5" />
                      Make 1st
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    aria-label="Remove photo"
                    className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950/80 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-zinc-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            {editingProduct ? "Save Changes" : "Publish Product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}