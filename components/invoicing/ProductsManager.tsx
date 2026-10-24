"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Spinner } from "@heroui/spinner";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { API_URL } from "@/config/api";
import { errorMessage, fromCents, money, Product, toCents, unwrap } from "@/lib/crm";

export default function ProductsManager({ isOpen, onClose, currency }: { isOpen: boolean; onClose: () => void; currency: string }) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [taxable, setTaxable] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(unwrap<Product[]>(await api.get(`${API_URL}/products`)) || []);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo cargar el catálogo"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const reset = () => {
    setEditing(null);
    setName("");
    setPrice("");
    setDescription("");
    setTaxable(true);
  };

  const save = async () => {
    const cents = toCents(price);
    if (!name.trim()) return toast.error("Ponle nombre al producto o servicio");
    if (cents === null) return toast.error("Precio inválido");
    setSaving(true);
    try {
      const payload = { name: name.trim(), description: description.trim() || undefined, unitPriceCents: cents, taxable };
      if (editing) await api.patch(`${API_URL}/products/${editing._id}`, payload);
      else await api.post(`${API_URL}/products`, payload);
      reset();
      await load();
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Product) => {
    if (!window.confirm(`¿Quitar "${p.name}" del catálogo? Los documentos ya creados no cambian.`)) return;
    try {
      await api.delete(`${API_URL}/products/${p._id}`);
      if (editing?._id === p._id) reset();
      await load();
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo quitar"));
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="2xl" onOpenChange={(o) => !o && onClose()}>
      <ModalContent>
        <ModalHeader>Catálogo de productos y servicios</ModalHeader>
        <ModalBody className="gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_140px]">
            <Input label="Nombre" value={name} variant="bordered" onValueChange={setName} />
            <Input label={`Precio (${currency})`} inputMode="decimal" value={price} variant="bordered" onValueChange={setPrice} />
          </div>
          <Textarea label="Descripción (opcional)" minRows={1} value={description} variant="bordered" onValueChange={setDescription} />
          <div className="flex items-center justify-between">
            <Switch isSelected={taxable} size="sm" onValueChange={setTaxable}>Lleva impuesto</Switch>
            <div className="flex gap-2">
              {editing && <Button variant="light" onPress={reset}>Cancelar</Button>}
              <Button color="primary" isLoading={saving} startContent={!editing ? <Plus size={14} /> : undefined} onPress={save}>{editing ? "Guardar cambios" : "Agregar al catálogo"}</Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-4"><Spinner size="sm" /></div>
          ) : items.length === 0 ? (
            <p className="text-sm text-default-500">Tu catálogo está vacío. Agrega lo que vendes para llenar las facturas con un clic.</p>
          ) : (
            <ul className="divide-y divide-divider rounded-xl border border-divider">
              {items.map((p) => (
                <li key={p._id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-default-500">{money(p.unitPriceCents, currency)}{p.taxable ? "" : " · sin impuesto"}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button isIconOnly size="sm" variant="light" onPress={() => { setEditing(p); setName(p.name); setPrice(fromCents(p.unitPriceCents)); setDescription(p.description || ""); setTaxable(p.taxable); }}><Pencil size={14} /></Button>
                    <Button isIconOnly color="danger" size="sm" variant="light" onPress={() => remove(p)}><Trash2 size={14} /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ModalBody>
        <ModalFooter><Button onPress={onClose}>Cerrar</Button></ModalFooter>
      </ModalContent>
    </Modal>
  );
}
