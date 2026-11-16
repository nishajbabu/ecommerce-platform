"use client";

import * as React from "react";
import { FolderPlus, PackageOpen } from "lucide-react";
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
  image_url?: string;
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

export default function ProductFormModal({
  open,
  onClose,
  editingProduct,
  categories,
  onSaved,
  onCategoryCreated,
}: ProductFormModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [creatingCat, setCreatingCat] = React.useState(false);
  const [showNewCat, setShowNewCat] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState("");
  const [newCatDesc, setNewCatDesc] = React.useState("");

  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    price: "",
    stock_quantity: "",
    category_id: "",
    image_url: "",
  });

  React.useEffect(() => {
    if (editingProduct) {
      setFormData({
        title: editingProduct.title,
        description: editingProduct.description || "",
        price: editingProduct.price.toString(),
        stock_quantity: editingProduct.stock_quantity.toString(),
        category_id: editingProduct.category_id.toString(),
        image_url: editingProduct.image_url || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        price: "",
        stock_quantity: "",
        category_id: categories[0]?.id?.toString() || "",
        image_url: "",
      });
    }
    setShowNewCat(false);
    setNewCatName("");
    setNewCatDesc("");
  }, [editingProduct, categories, open]);

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
      image_url: formData.image_url.trim() || undefined,
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
          : "Publish a new item directly to the live storefront."
      }
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
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
              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
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
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
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

        {/* Image URL + Live Preview */}
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Input
              label="Image URL (Optional)"
              type="url"
              value={formData.image_url}
              onChange={(e) =>
                setFormData({ ...formData, image_url: e.target.value })
              }
              placeholder="https://images.unsplash.com/..."
            />
          </div>
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center">
            {formData.image_url ? (
              <img
                src={formData.image_url}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <PackageOpen className="h-5 w-5 text-zinc-400" />
            )}
          </div>
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