import type { Money } from "@/types";

// Matches fw-cart-service/.../dto/CartItemDto.java exactly.
export interface ServerCartItem {
    id: string;          // server-generated UUID (cart-item PK, NOT the box id)
    itemId: string;      // surprise-box UUID (same value frontend has as boxId)
    name: string;
    price: Money;        // backend now emits the Money wire form {amount, currency}
    quantity: number;
    storeId: string;     // server-resolved, prevents cross-store cart
    imageUrl: string;
}

// Matches fw-cart-service/.../dto/CartDto.java
export interface ServerCart {
    cartId: string;
    items: ServerCartItem[];
    totalPrice: Money;
    itemCount: number;
}

// Matches AddToCartRequest.java — note: NO storeId (resolved server-side per ADR 0002)
export interface AddToCartRequestBody {
    itemId: string;
    quantity: number;
}
