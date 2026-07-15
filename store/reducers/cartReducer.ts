import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getCookie } from "cookies-next";
import { logout, setGuest, setUserId } from "./authReducer";

const LEGACY_CART_STORAGE_KEY = "productCart";

export type CartItem = {
  id: string;
  productId: string;
  title: string;
  price: number;
  image: string;
  shopId?: string;
  ownerId?: string;
  selectedVariants: Record<string, string>;
  quantity: number;
  sellerLabel: string;
  sellerImage: string;
};

export type AddToCartPayload = Omit<CartItem, "id" | "quantity"> & {
  quantity?: number;
};

type CartState = {
  items: CartItem[];
  userId: string | null;
};

function getCartStorageKey(userId: string | null | undefined): string {
  if (userId) return `productCart_${userId}`;
  return "productCart_guest";
}

function readUserIdFromCookie(): string | null {
  if (typeof window === "undefined") return null;
  const id = getCookie("userId");
  return typeof id === "string" && id ? id : null;
}

function loadCartFromStorage(userId: string | null | undefined): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getCartStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistCart(items: CartItem[], userId: string | null | undefined) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getCartStorageKey(userId), JSON.stringify(items));
}

function switchCartUser(state: CartState, nextUserId: string | null) {
  if (state.userId === nextUserId) return;
  persistCart(state.items, state.userId);
  state.userId = nextUserId;
  state.items = loadCartFromStorage(nextUserId);
  if (typeof window !== "undefined") {
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
  }
}

export function getCartLineId(
  productId: string,
  selectedVariants: Record<string, string>,
): string {
  const variantKey = Object.keys(selectedVariants)
    .sort()
    .map((key) => `${key}:${selectedVariants[key]}`)
    .join("|");
  return `${productId}__${variantKey}`;
}

const initialUserId = readUserIdFromCookie();

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: loadCartFromStorage(initialUserId),
    userId: initialUserId,
  } satisfies CartState,
  reducers: {
    addToCart: (state, action: PayloadAction<AddToCartPayload>) => {
      const { quantity = 1, ...item } = action.payload;
      const id = getCartLineId(item.productId, item.selectedVariants);
      const existing = state.items.find((line) => line.id === id);

      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ ...item, id, quantity });
      }

      persistCart(state.items, state.userId);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      persistCart(state.items, state.userId);
    },
    updateCartQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>,
    ) => {
      const item = state.items.find((line) => line.id === action.payload.id);
      if (!item) return;

      if (action.payload.quantity < 1) {
        state.items = state.items.filter((line) => line.id !== action.payload.id);
      } else {
        item.quantity = action.payload.quantity;
      }

      persistCart(state.items, state.userId);
    },
    clearCart: (state) => {
      state.items = [];
      persistCart(state.items, state.userId);
    },
    hydrateCart: (state) => {
      state.items = loadCartFromStorage(state.userId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setUserId, (state, action) => {
        switchCartUser(state, action.payload);
      })
      .addCase(logout, (state) => {
        persistCart(state.items, state.userId);
        state.userId = null;
        state.items = [];
        persistCart([], null);
        if (typeof window !== "undefined") {
          localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
        }
      })
      .addCase(setGuest, (state, action) => {
        if (!action.payload) return;
        switchCartUser(state, null);
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  hydrateCart,
} = cartSlice.actions;

export default cartSlice.reducer;
