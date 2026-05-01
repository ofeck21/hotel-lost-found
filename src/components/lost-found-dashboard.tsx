"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { LostFoundItem, LostFoundPayload } from "@/lib/types";

const emptyForm: LostFoundPayload = {
  guestName: "",
  checkIn: "",
  checkOut: "",
  itemName: "",
  itemPhoto: "",
  roomNumber: "",
  remark: "Azana",
  createdBy: "",
  pickupHandle: "",
  pickupDocumentation: "",
  status: "Belum Diambil",
};

function toInputDate(dateValue: string) {
  if (!dateValue) return "";
  return dateValue.slice(0, 10);
}

function formatDate(dateValue: string) {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeAssetUrl(url: string) {
  if (!url) return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("/api/uploads/")) {
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/")) {
    return `/api/uploads/${encodeURIComponent(trimmed.slice("/uploads/".length))}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith("/uploads/")) {
      return `/api/uploads/${encodeURIComponent(parsed.pathname.slice("/uploads/".length))}`;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

async function parseResponseBody(response: Response): Promise<Record<string, unknown> | null> {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { message: raw };
  }
}

type IconProps = {
  className?: string;
};

function KeyIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="8" cy="12" r="3" />
      <path d="M11 12h10" />
      <path d="M18 12v3" />
      <path d="M21 12v2" />
    </svg>
  );
}

function LogoutIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </svg>
  );
}

function LoginIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </svg>
  );
}

function FileDownIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M12 12v6" />
      <path d="M9 15l3 3 3-3" />
    </svg>
  );
}

function PlusIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function ResetIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M3 10h6V4" />
      <path d="M3 10a9 9 0 1 0 2.6-6.4L3 6" />
    </svg>
  );
}

function EyeIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EditIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 10v6" />
      <path d="M14 10v6" />
    </svg>
  );
}

function CloseIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function SaveIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}

function PrintIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </svg>
  );
}

export function LostFoundDashboard() {
  const router = useRouter();
  const allowedImageTypes = ["image/png", "image/jpeg", "image/webp"];
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [form, setForm] = useState<LostFoundPayload>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pickupHandleOptions, setPickupHandleOptions] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"Semua" | "Belum Diambil" | "Sudah Diambil">("Semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState("Dokumentasi Pengambilan");
  const [selectedItemPhotoFile, setSelectedItemPhotoFile] = useState<File | null>(null);
  const [selectedItemPhotoPreview, setSelectedItemPhotoPreview] = useState<string | null>(null);
  const [selectedDocumentationFile, setSelectedDocumentationFile] = useState<File | null>(null);
  const [selectedDocumentationPreview, setSelectedDocumentationPreview] = useState<string | null>(null);
  const pageSize = 10;
  const tableColSpan = isAuthenticated ? 13 : 12;

  const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
  });

  function handleDateFromChange(nextFrom: string) {
    setDateFrom(nextFrom);
    if (dateTo && nextFrom && nextFrom > dateTo) {
      setDateTo(nextFrom);
    }
  }

  function handleDateToChange(nextTo: string) {
    setDateTo(nextTo);
    if (dateFrom && nextTo && nextTo < dateFrom) {
      setDateFrom(nextTo);
    }
  }

  function resetFilters() {
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("Semua");
  }

  function openPreviewImage(url: string, title: string) {
    setPreviewImageUrl(url);
    setPreviewImageTitle(title);
  }

  function closePreviewImage() {
    setPreviewImageUrl(null);
    setPreviewImageTitle("Dokumentasi Pengambilan");
  }

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();

    return items.filter((item) => {
      const textMatch =
        !q ||
        item.guestName.toLowerCase().includes(q) ||
        item.itemName.toLowerCase().includes(q) ||
        item.roomNumber.toLowerCase().includes(q) ||
        item.createdBy.toLowerCase().includes(q);

      const itemDate = toInputDate(item.checkIn);
      const dateFromMatch = !dateFrom || itemDate >= dateFrom;
      const dateToMatch = !dateTo || itemDate <= dateTo;
      const statusMatch = statusFilter === "Semua" || item.status === statusFilter;

      return textMatch && dateFromMatch && dateToMatch && statusMatch;
    });
  }, [items, query, dateFrom, dateTo, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage]);

  async function loadItems() {
    setLoading(true);
    try {
      const response = await fetch("/api/items", { cache: "no-store" });
      const data = (await response.json()) as LostFoundItem[];
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  async function checkSession() {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    const data = (await response.json()) as { authenticated: boolean };
    setIsAuthenticated(data.authenticated);
  }

  async function loadPickupHandleOptions() {
    const response = await fetch("/api/pickup-handles", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as string[];
    setPickupHandleOptions(data);
  }

  function clearSelectedItemPhoto() {
    if (selectedItemPhotoPreview) {
      URL.revokeObjectURL(selectedItemPhotoPreview);
    }
    setSelectedItemPhotoFile(null);
    setSelectedItemPhotoPreview(null);
  }

  function clearSelectedDocumentation() {
    if (selectedDocumentationPreview) {
      URL.revokeObjectURL(selectedDocumentationPreview);
    }
    setSelectedDocumentationFile(null);
    setSelectedDocumentationPreview(null);
  }

  useEffect(() => {
    void loadItems();
    void checkSession();
    void loadPickupHandleOptions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, dateFrom, dateTo, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    return () => {
      if (selectedItemPhotoPreview) {
        URL.revokeObjectURL(selectedItemPhotoPreview);
      }
      if (selectedDocumentationPreview) {
        URL.revokeObjectURL(selectedDocumentationPreview);
      }
    };
  }, [selectedItemPhotoPreview, selectedDocumentationPreview]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    setEditId(null);
    setForm(emptyForm);
    setIsModalOpen(false);
    setIsPasswordModalOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    clearSelectedItemPhoto();
    clearSelectedDocumentation();
    await toast.fire({
      icon: "success",
      title: "Berhasil logout",
    });
    router.push("/login");
  }

  async function handleUpdatePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi password tidak sama.");
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        setPasswordError(payload.message ?? "Gagal mengubah password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      setIsPasswordModalOpen(false);
      await toast.fire({
        icon: "success",
        title: "Password berhasil diperbarui",
      });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const payload = await parseResponseBody(response);
    if (!response.ok) {
      const message = typeof payload?.message === "string" ? payload.message : "Upload gagal";
      throw new Error(message);
    }

    const url = typeof payload?.url === "string" ? payload.url : "";
    if (!url) {
      throw new Error("Upload gagal: respons server tidak valid");
    }

    return url;
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAuthenticated || saving) return;

    setSaving(true);
    try {
      const method = editId ? "PUT" : "POST";
      const target = editId ? `/api/items/${editId}` : "/api/items";
      const payload: LostFoundPayload = { ...form };

      if (selectedItemPhotoFile) {
        payload.itemPhoto = await uploadImage(selectedItemPhotoFile);
      }

      if (selectedDocumentationFile) {
        payload.pickupDocumentation = await uploadImage(selectedDocumentationFile);
      }

      const response = await fetch(target, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await parseResponseBody(response);
        const message = typeof errorPayload?.message === "string" ? errorPayload.message : "Gagal menyimpan data";
        throw new Error(message);
      }

      setForm(emptyForm);
      setEditId(null);
      setIsModalOpen(false);
      clearSelectedItemPhoto();
      clearSelectedDocumentation();
      await loadItems();
      await loadPickupHandleOptions();
      await toast.fire({
        icon: "success",
        title: editId ? "Data berhasil diperbarui" : "Data berhasil ditambahkan",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      await toast.fire({
        icon: "error",
        title: message,
      });
    } finally {
      setSaving(false);
    }
  }

  function openCreateModal() {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setEditId(null);
    setForm(emptyForm);
    clearSelectedItemPhoto();
    clearSelectedDocumentation();
    setIsModalOpen(true);
  }

  function handleEdit(item: LostFoundItem) {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setEditId(item.id);
    setForm({
      guestName: item.guestName,
      checkIn: toInputDate(item.checkIn),
      checkOut: toInputDate(item.checkOut),
      itemName: item.itemName,
      itemPhoto: item.itemPhoto,
      roomNumber: item.roomNumber,
      remark: item.remark,
      createdBy: item.createdBy,
      pickupHandle: item.pickupHandle,
      pickupDocumentation: item.pickupDocumentation,
      status: item.status,
    });
    clearSelectedItemPhoto();
    clearSelectedDocumentation();
    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const result = await Swal.fire({
      title: "Hapus data ini?",
      text: "Data yang dihapus tidak bisa dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#8a0303",
    });

    if (!result.isConfirmed) return;

    const response = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json()) as { message?: string };
      await toast.fire({
        icon: "error",
        title: payload.message ?? "Gagal menghapus data",
      });
      return;
    }

    await loadItems();
    await toast.fire({
      icon: "success",
      title: "Data berhasil dihapus",
    });
  }

  async function handlePrintItem(item: LostFoundItem) {
    const toDataUrl = async (url: string): Promise<string | null> => {
      const normalizedUrl = normalizeAssetUrl(url);
      if (!normalizedUrl) return null;
      try {
        const response = await fetch(normalizedUrl);
        if (!response.ok) return null;
        const blob = await response.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => reject(new Error("Gagal membaca gambar"));
          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    };

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Lost & Found", margin, 52);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("FrontOne & Azana Style Madura", margin, 66);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 76, pageWidth - margin, 76);

    // Fetch photo
    const photoDataUrl = item.itemPhoto ? await toDataUrl(item.itemPhoto) : null;

    // Layout: details left, photo right
    const photoColWidth = photoDataUrl ? 160 : 0;
    const detailsWidth = photoDataUrl ? contentWidth - photoColWidth - 16 : contentWidth;
    const startY = 92;

    const rows: [string, string][] = [
      ["Nama Tamu", item.guestName],
      ["Check In", formatDate(item.checkIn)],
      ["Check Out", formatDate(item.checkOut)],
      ["Barang", item.itemName],
      ["No Kamar", item.roomNumber],
      ["Remark", item.remark],
      ["Dibuat Oleh", item.createdBy],
      ["Pickup Handle", item.pickupHandle || "-"],
      ["Keterangan", item.status],
    ];

    const labelWidth = 100;
    const rowHeight = 22;
    doc.setFontSize(9);

    rows.forEach(([label, value], i) => {
      const y = startY + i * rowHeight;

      // label
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text(label, margin, y);

      // value
      doc.setFont("helvetica", "normal");
      if (label === "Keterangan") {
        const isDone = value === "Sudah Diambil";
        doc.setTextColor(isDone ? 22 : 146, isDone ? 101 : 64, isDone ? 52 : 14);
      } else {
        doc.setTextColor(30, 41, 59);
      }
      const lines = doc.splitTextToSize(value, detailsWidth - labelWidth - 8);
      doc.text(lines as string[], margin + labelWidth, y);

      // row separator
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 8, margin + detailsWidth, y + 8);
    });

    // Photo on the right
    if (photoDataUrl) {
      const photoX = margin + detailsWidth + 16;
      const photoY = startY - 4;
      const photoW = photoColWidth;
      const photoH = photoColWidth * 0.75;
      const format = photoDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(photoDataUrl, format, photoX, photoY, photoW, photoH);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.text("Foto Barang", photoX + photoW / 2, photoY + photoH + 12, { align: "center" });
    }

    doc.save(`lost-found-${item.guestName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  }

  async function handleExportPdf() {
    const exportItems = filteredItems;

    if (!dateFrom || !dateTo) {
      await toast.fire({
        icon: "warning",
        title: "Pilih tanggal mulai dan tanggal akhir sebelum export PDF",
      });
      return;
    }

    if (exportItems.length === 0) {
      await toast.fire({
        icon: "info",
        title: "Tidak ada data untuk diexport",
      });
      return;
    }

    const toDataUrl = async (url: string): Promise<string | null> => {
      if (!url) return null;

      const normalizedUrl = normalizeAssetUrl(url);
      if (!normalizedUrl) return null;

      try {
        const response = await fetch(normalizedUrl);
        if (!response.ok) return null;

        const blob = await response.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => reject(new Error("Gagal membaca file gambar"));
          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    };

    const imageRows = await Promise.all(
      exportItems.map(async (item) => ({
        itemPhoto: await toDataUrl(item.itemPhoto),
        pickupDocumentation: await toDataUrl(item.pickupDocumentation),
      })),
    );

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const periodText = `Periode: ${formatDate(new Date(dateFrom).toISOString())} - ${formatDate(new Date(dateTo).toISOString())}`;

    doc.setFontSize(14);
    doc.text("Laporan Lost & Found - FrontOne & Azana Style Madura", pageWidth / 2, 30, { align: "center" });
    doc.setFontSize(10);
    doc.text(periodText, pageWidth / 2, 46, { align: "center" });

    autoTable(doc, {
      startY: 58,
      head: [["No", "Nama Tamu", "Check In", "Check Out", "Barang", "No Kamar", "Remark", "Dibuat Oleh", "Pickup Handle", "Foto Barang", "Dokumentasi Pengambilan", "Keterangan"]],
      body: exportItems.map((item, index) => [
        String(index + 1),
        item.guestName,
        formatDate(item.checkIn),
        formatDate(item.checkOut),
        item.itemName,
        item.roomNumber,
        item.remark,
        item.createdBy,
        item.pickupHandle,
        item.itemPhoto ? " " : "-",
        item.pickupDocumentation ? " " : "-",
        item.status,
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 4,
        minCellHeight: 44,
      },
      headStyles: {
        fillColor: [138, 3, 3],
        valign: "middle",
        minCellHeight: 28,
      },
      columnStyles: {
        9: { cellWidth: 72 },
        10: { cellWidth: 72 },
      },
      didParseCell: (data) => {
        if (data.section !== "body") return;

        const isStatusColumn = data.column.index === 11;
        const isSudahDiambil = String(data.cell.raw ?? "") === "Sudah Diambil";
        if (!isStatusColumn || !isSudahDiambil) return;

        data.cell.styles.fillColor = [220, 252, 231];
        data.cell.styles.textColor = [22, 101, 52];
      },
      didDrawCell: (data) => {
        if (data.section !== "body") return;

        const imageData = imageRows[data.row.index];
        if (!imageData) return;

        const isItemPhotoCol = data.column.index === 9;
        const isDocumentationCol = data.column.index === 10;
        if (!isItemPhotoCol && !isDocumentationCol) return;

        const dataUrl = isItemPhotoCol ? imageData.itemPhoto : imageData.pickupDocumentation;
        if (!dataUrl) return;

        const format = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
        const padding = 3;
        const x = data.cell.x + padding;
        const y = data.cell.y + padding;
        const width = data.cell.width - padding * 2;
        const height = data.cell.height - padding * 2;

        doc.addImage(dataUrl, format, x, y, width, height);
      },
    });

    doc.save(`lost-found-${new Date().toISOString().slice(0, 10)}.pdf`);

    await toast.fire({
      icon: "success",
      title: "Export PDF berhasil",
    });
  }

  return (
    <main className="w-full px-4 pb-10 pt-6 sm:px-8 lg:px-10">
      <header className="card mb-6 overflow-hidden shadow-float">
        <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-white/80">FrontOne & Azana Style Madura</p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Lost & Found</h1>
              <p className="mt-2 text-sm text-white/85 sm:text-base">
                Catatan barang tamu yang tertinggal, pantau status pickup, dan dokumentasi serah terima.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
                  >
                    <KeyIcon />
                    Ubah Password
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
                  >
                    <LogoutIcon />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
                >
                  <LoginIcon />
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="card min-h-screen p-4 shadow-float sm:p-6">
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Data Lost & Found Log</h2>
          <div className="flex flex-wrap gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-800 transition hover:bg-rose-50"
              >
                <FileDownIcon />
                Export PDF
              </button>
            ) : null}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                <PlusIcon />
                Tambah
              </button>
            ) : null}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-2">
          <label className="w-full sm:w-72">
            <span className="mb-1 block text-xs font-medium text-slate-600">Search</span>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Cari nama tamu / barang"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-600">Dari Tanggal</span>
            <input
              type="date"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => handleDateFromChange(e.target.value)}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-600">Sampai Tanggal</span>
            <input
              type="date"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => handleDateToChange(e.target.value)}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-600">Status Ambil</span>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "Semua" | "Belum Diambil" | "Sudah Diambil")
              }
            >
              <option value="Semua">Semua</option>
              <option value="Belum Diambil">Belum Diambil</option>
              <option value="Sudah Diambil">Sudah Diambil</option>
            </select>
          </label>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ResetIcon className="h-3.5 w-3.5" />
            Reset Filter
          </button>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="h-12 align-middle px-2 py-0">No</th>
                <th className="h-12 align-middle px-2 py-0">Tamu</th>
                <th className="h-12 align-middle px-2 py-0">Check In</th>
                <th className="h-12 align-middle px-2 py-0">Check Out</th>
                <th className="h-12 align-middle px-2 py-0">Barang</th>
                <th className="h-12 align-middle px-2 py-0">Foto Barang</th>
                <th className="h-12 align-middle px-2 py-0">No Kamar</th>
                <th className="h-12 align-middle px-2 py-0">Remark</th>
                <th className="h-12 align-middle px-2 py-0">Dibuat Oleh</th>
                <th className="h-12 align-middle px-2 py-0">Pickup Handle</th>
                <th className="h-12 align-middle px-2 py-0">Dokumentasi</th>
                <th className="h-12 align-middle px-2 py-0">Keterangan</th>
                {isAuthenticated ? <th className="h-12 align-middle px-2 py-0">Aksi</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={tableColSpan} className="px-2 py-6 text-center text-sm text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : null}
              {!loading && filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={tableColSpan} className="px-2 py-6 text-center text-sm text-slate-500">
                    Belum ada data.
                  </td>
                </tr>
              ) : null}
              {paginatedItems.map((item, index) => (
                <tr key={item.id} className="align-top">
                  <td className="px-2 py-3 text-slate-600">{(currentPage - 1) * pageSize + index + 1}</td>
                  <td className="px-2 py-3 font-medium">{item.guestName}</td>
                  <td className="px-2 py-3 text-slate-600">{formatDate(item.checkIn)}</td>
                  <td className="px-2 py-3 text-slate-600">{formatDate(item.checkOut)}</td>
                  <td className="px-2 py-3">{item.itemName}</td>
                  <td className="px-2 py-3">
                    {item.itemPhoto ? (
                      <button
                        type="button"
                        onClick={() => openPreviewImage(normalizeAssetUrl(item.itemPhoto), "Foto Barang")}
                        className="inline-flex items-center gap-1 text-brand-700 hover:underline"
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                        Lihat
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-2 py-3">{item.roomNumber}</td>
                  <td className="px-2 py-3">{item.remark}</td>
                  <td className="px-2 py-3">{item.createdBy}</td>
                  <td className="px-2 py-3">{item.pickupHandle}</td>
                  <td className="px-2 py-3">
                    {item.pickupDocumentation ? (
                      <button
                        type="button"
                        onClick={() => openPreviewImage(normalizeAssetUrl(item.pickupDocumentation), "Dokumentasi Pengambilan")}
                        className="inline-flex items-center gap-1 text-brand-700 hover:underline"
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                        Lihat
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        item.status === "Sudah Diambil" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  {isAuthenticated ? (
                    <td className="px-2 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-brand-200 px-2 py-1 text-xs font-medium text-brand-700"
                        >
                          <EditIcon className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintItem(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
                        >
                          <PrintIcon className="h-3.5 w-3.5" />
                          Cetak
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 lg:hidden">
          {paginatedItems.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-800">{item.guestName}</h3>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    item.status === "Sudah Diambil" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <p className="text-sm text-slate-700">Barang: {item.itemName}</p>
              {item.itemPhoto ? (
                <button
                  type="button"
                    onClick={() => openPreviewImage(normalizeAssetUrl(item.itemPhoto), "Foto Barang")}
                  className="relative mt-3 block w-full overflow-hidden rounded-lg border border-slate-200"
                  aria-label="Lihat foto barang"
                >
                  <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white">
                    <EyeIcon className="h-3 w-3" />
                    Lihat
                  </span>
                  <Image
                    src={item.itemPhoto}
                    alt="Foto barang"
                    width={600}
                    height={340}
                    className="h-40 w-full object-cover"
                  />
                </button>
              ) : null}
              <p className="text-sm text-slate-600">No Kamar: {item.roomNumber}</p>
              <p className="text-sm text-slate-600">Check In: {formatDate(item.checkIn)}</p>
              <p className="text-sm text-slate-600">Check Out: {formatDate(item.checkOut)}</p>
              <p className="text-sm text-slate-600">Remark: {item.remark}</p>
              <p className="text-sm text-slate-600">Dibuat Oleh: {item.createdBy}</p>
              <p className="text-sm text-slate-600">Pickup Handle: {item.pickupHandle}</p>

              {item.pickupDocumentation ? (
                <button
                  type="button"
                    onClick={() => openPreviewImage(normalizeAssetUrl(item.pickupDocumentation), "Dokumentasi Pengambilan")}
                  className="relative mt-3 block w-full overflow-hidden rounded-lg border border-slate-200"
                  aria-label="Lihat dokumentasi"
                >
                  <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white">
                    <EyeIcon className="h-3 w-3" />
                    Lihat
                  </span>
                  <Image
                    src={item.pickupDocumentation}
                    alt="Dokumentasi pengambilan"
                    width={600}
                    height={340}
                    className="h-40 w-full object-cover"
                  />
                </button>
              ) : null}

              {isAuthenticated ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700"
                  >
                    <EditIcon className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrintItem(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                  >
                    <PrintIcon className="h-3.5 w-3.5" />
                    Cetak
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Hapus
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        {!loading && filteredItems.length > 0 ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-600">
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-xs text-slate-600">{currentPage}</span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="card max-h-[92vh] w-full overflow-y-auto p-4 shadow-float sm:max-w-4xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">{editId ? "Edit Data" : "Tambah Data"}</h2>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditId(null);
                  setForm(emptyForm);
                  clearSelectedItemPhoto();
                  clearSelectedDocumentation();
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <CloseIcon />
                Tutup
              </button>
            </div>

            <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label>
                <span className="mb-1 block text-xs font-medium text-slate-600">Nama Tamu</span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Masukkan nama tamu"
                  value={form.guestName}
                  onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                  required
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-medium text-slate-600">Check In</span>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.checkIn}
                  max={form.checkOut || undefined}
                  onChange={(e) => {
                    const nextCheckIn = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      checkIn: nextCheckIn,
                      checkOut:
                        prev.checkOut && nextCheckIn && nextCheckIn > prev.checkOut
                          ? nextCheckIn
                          : prev.checkOut,
                    }));
                  }}
                  required
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-medium text-slate-600">Check Out</span>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.checkOut}
                  min={form.checkIn || undefined}
                  onChange={(e) => {
                    const nextCheckOut = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      checkOut: nextCheckOut,
                      checkIn:
                        prev.checkIn && nextCheckOut && nextCheckOut < prev.checkIn
                          ? nextCheckOut
                          : prev.checkIn,
                    }));
                  }}
                  required
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-medium text-slate-600">Barang</span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Nama barang"
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                  required
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-medium text-slate-600">No Kamar</span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Nomor kamar"
                  value={form.roomNumber}
                  onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                  required
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-medium text-slate-600">Remark</span>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value as LostFoundPayload["remark"] })}
                >
                  <option value="Azana">Azana</option>
                  <option value="FrontOne">FrontOne</option>
                </select>
              </label>

              <label>
                <span className="mb-1 block text-xs font-medium text-slate-600">Dibuat Oleh</span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Pilih atau ketik nama pembuat"
                  list="pickup-handle-options"
                  value={form.createdBy}
                  onChange={(e) => setForm({ ...form, createdBy: e.target.value })}
                  required
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Pickup Handle {form.status === "Sudah Diambil" ? "(wajib untuk Sudah Diambil)" : "(opsional)"}
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Pilih atau ketik nama pickup handle"
                  list="pickup-handle-options"
                  value={form.pickupHandle}
                  onChange={(e) => setForm({ ...form, pickupHandle: e.target.value })}
                  required={form.status === "Sudah Diambil"}
                />
                <datalist id="pickup-handle-options">
                  {pickupHandleOptions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </label>

              <label>
                <span className="mb-1 block text-xs font-medium text-slate-600">Keterangan</span>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as LostFoundPayload["status"] })}
                >
                  <option value="Belum Diambil">Belum Diambil</option>
                  <option value="Sudah Diambil">Sudah Diambil</option>
                </select>
              </label>

              <div className="sm:col-span-2 lg:col-span-3 grid gap-3 md:grid-cols-2">
                <label>
                  <span className="mb-1 block text-sm text-slate-600">Foto Barang (wajib)</span>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={saving}
                      required={!form.itemPhoto && !selectedItemPhotoFile}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        if (!allowedImageTypes.includes(file.type)) {
                          await toast.fire({
                            icon: "error",
                            title: "Foto barang hanya boleh file gambar (JPG, PNG, WEBP)",
                          });
                          e.target.value = "";
                          return;
                        }

                        if (selectedItemPhotoPreview) {
                          URL.revokeObjectURL(selectedItemPhotoPreview);
                        }

                        setSelectedItemPhotoFile(file);
                        setSelectedItemPhotoPreview(URL.createObjectURL(file));
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-1 file:text-brand-800"
                    />
                  </div>

                  {selectedItemPhotoPreview ? (
                    <button
                      type="button"
                      onClick={() => openPreviewImage(selectedItemPhotoPreview, "Foto Barang")}
                      className="relative mt-3 block w-full overflow-hidden rounded-lg border border-slate-200"
                      aria-label="Lihat preview foto barang"
                    >
                      <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white">
                        <EyeIcon className="h-3 w-3" />
                        Lihat
                      </span>
                      <Image
                        src={selectedItemPhotoPreview}
                        alt="Preview foto barang"
                        width={600}
                        height={340}
                        className="h-40 w-full object-cover"
                      />
                    </button>
                  ) : form.itemPhoto ? (
                    <button
                      type="button"
                      onClick={() => openPreviewImage(form.itemPhoto, "Foto Barang")}
                      className="relative mt-3 block w-full overflow-hidden rounded-lg border border-slate-200"
                      aria-label="Lihat foto barang tersimpan"
                    >
                      <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white">
                        <EyeIcon className="h-3 w-3" />
                        Lihat
                      </span>
                      <Image
                        src={form.itemPhoto}
                        alt="Preview foto barang"
                        width={600}
                        height={340}
                        className="h-40 w-full object-cover"
                      />
                    </button>
                  ) : (
                    <span className="mt-2 block text-xs text-slate-500">Belum ada file dipilih</span>
                  )}
                </label>

                <label>
                  <span className="mb-1 block text-sm text-slate-600">
                    Dokumentasi Pengambilan {form.status === "Sudah Diambil" ? "(wajib)" : "(opsional)"}
                  </span>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={saving}
                      required={form.status === "Sudah Diambil" && !form.pickupDocumentation && !selectedDocumentationFile}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        if (!allowedImageTypes.includes(file.type)) {
                          await toast.fire({
                            icon: "error",
                            title: "Dokumentasi hanya boleh file gambar (JPG, PNG, WEBP)",
                          });
                          e.target.value = "";
                          return;
                        }

                        if (selectedDocumentationPreview) {
                          URL.revokeObjectURL(selectedDocumentationPreview);
                        }

                        setSelectedDocumentationFile(file);
                        setSelectedDocumentationPreview(URL.createObjectURL(file));
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-1 file:text-brand-800"
                    />
                  </div>

                  {selectedDocumentationPreview ? (
                    <button
                      type="button"
                      onClick={() => openPreviewImage(selectedDocumentationPreview, "Dokumentasi Pengambilan")}
                      className="relative mt-3 block w-full overflow-hidden rounded-lg border border-slate-200"
                      aria-label="Lihat preview dokumentasi"
                    >
                      <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white">
                        <EyeIcon className="h-3 w-3" />
                        Lihat
                      </span>
                      <Image
                        src={selectedDocumentationPreview}
                        alt="Preview dokumentasi upload"
                        width={600}
                        height={340}
                        className="h-40 w-full object-cover"
                      />
                    </button>
                  ) : form.pickupDocumentation ? (
                    <button
                      type="button"
                      onClick={() => openPreviewImage(form.pickupDocumentation, "Dokumentasi Pengambilan")}
                      className="relative mt-3 block w-full overflow-hidden rounded-lg border border-slate-200"
                      aria-label="Lihat dokumentasi tersimpan"
                    >
                      <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white">
                        <EyeIcon className="h-3 w-3" />
                        Lihat
                      </span>
                      <Image
                        src={form.pickupDocumentation}
                        alt="Preview dokumentasi upload"
                        width={600}
                        height={340}
                        className="h-40 w-full object-cover"
                      />
                    </button>
                  ) : (
                    <span className="mt-2 block text-xs text-slate-500">Belum ada file dipilih</span>
                  )}
                </label>
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditId(null);
                    setForm(emptyForm);
                    clearSelectedItemPhoto();
                    clearSelectedDocumentation();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <CloseIcon />
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition enabled:hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <SaveIcon />
                  {saving ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isPasswordModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="card w-full p-4 shadow-float sm:max-w-md sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Ubah Password</h2>
              <button
                type="button"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError("");
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <CloseIcon />
                Tutup
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Password Saat Ini"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Password Baru"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Konfirmasi Password Baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />

              {passwordError ? <p className="text-sm text-rose-600">{passwordError}</p> : null}

              <button
                type="submit"
                disabled={passwordSaving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition enabled:hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <KeyIcon />
                {passwordSaving ? "Menyimpan..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {previewImageUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="card w-full max-w-3xl p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">{previewImageTitle}</h2>
              <button
                type="button"
                onClick={closePreviewImage}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <CloseIcon />
                Tutup
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <Image
                src={previewImageUrl}
                alt="Preview dokumentasi"
                width={1200}
                height={800}
                className="h-auto max-h-[70vh] w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
