"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
  notes?: string;
  choices?: any[];
}

interface CartStore {
  items: CartItem[];
  storeSlug: string | null;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getItemQty: (productId: string) => number;
  setStoreSlug: (slug: string) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      storeSlug: null,

      addItem: (item) => {
        const { items } = get();
        // Identify by both productId AND notes (which contains the options text)
        const existing = items.find((i) => i.productId === item.productId && i.notes === item.notes);

        if (existing) {
          set({
            items: items.map((i) =>
              (i.productId === item.productId && i.notes === item.notes)
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              { ...item, id: `${item.productId}-${Date.now()}` },
            ],
          });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },

      updateNotes: (id, notes) => {
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, notes } : i
          ),
        });
      },

      clearCart: () => set({ items: [], storeSlug: null }),

      getTotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getItemQty: (productId) => {
        return get().items
          .filter((i) => i.productId === productId)
          .reduce((sum, i) => sum + i.quantity, 0);
      },

      setStoreSlug: (slug) => set({ storeSlug: slug }),
    }),
    {
      name: "delivery-cart",
    }
  )
);
