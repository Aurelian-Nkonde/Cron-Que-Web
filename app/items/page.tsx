"use client";

import Link from "next/link";
import { createContext, useEffect, useState, type FormEvent } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { ItemThumbnail } from "@/components/item-thumbnail";
import { useAuth } from "@/lib/auth-context";
import { ApiError, createItem, getItems } from "@/lib/api";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import type { Item, ItemTimes } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TIMES_OPTIONS: { value: ItemTimes; label: string }[] = [
  { value: "2_minutes", label: "2 minutes" },
  { value: "5_minutes", label: "5 minutes" },
  { value: "15_minutes", label: "15 minutes" },
];

function ItemsPageContent() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [description, setDescription] = useState("");
  const [times, setTimes] = useState<ItemTimes>("2_minutes");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    getItems(token)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [token]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token || !user) return;
    if (!imageFile) {
      setError("Please select an image.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const imageUrl = await uploadImageToCloudinary(imageFile);
      const created = await createItem(
        { name, imageUrl, description, userId: user.id, times },
        token,
      );
      setItems((prev) => [created, ...prev]);
      setName("");
      setImageFile(null);
      setFileInputKey((k) => k + 1);
      setDescription("");
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Failed to create item.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>New item</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-description">Description</Label>
              <Input
                id="item-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-image-file">Image</Label>
              <Input
                key={fileInputKey}
                id="item-image-file"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Expires in</Label>
              <Select value={times} onValueChange={(v) => setTimes(v as ItemTimes)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMES_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create item"}
            </Button>
            {error && (
              <p className="text-sm text-destructive sm:col-span-2">{error}</p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link href={`/items/${item.id}`}>
                        <ItemThumbnail src={item.imageUrl} alt={item.name} />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/items/${item.id}`} className="hover:underline">
                        {item.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.status === "ACTIVE" ? "default" : "secondary"}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(item.expiresAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ItemsPage() {
  return (
    <AuthGuard>
      <ItemsPageContent />
    </AuthGuard>
  );
}
