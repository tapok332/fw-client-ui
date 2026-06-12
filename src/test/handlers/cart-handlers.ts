import { http, HttpResponse } from "msw";
import { ServerCart } from "@/types/cart";

// authHttpClient uses process.env.API_BASE_URL ?? "http://localhost:8080"
// Tests run in Node (vitest), so process.env.API_BASE_URL is not set → default "http://localhost:8080"
const API_BASE_URL = "http://localhost:8080";

const emptyCart: ServerCart = {
    cartId: "00000000-0000-0000-0000-000000000001",
    items: [],
    totalPrice: { amount: "0.00", currency: "UAH" },
    itemCount: 0,
};

const cartWithOneItem: ServerCart = {
    cartId: "00000000-0000-0000-0000-000000000001",
    items: [
        {
            id: "cart-item-1",
            itemId: "box-1",
            name: "Test Box",
            price: { amount: "150.00", currency: "UAH" },
            quantity: 1,
            storeId: "store-1",
            imageUrl: "/img.jpg",
        },
    ],
    totalPrice: { amount: "150.00", currency: "UAH" },
    itemCount: 1,
};

export const cartHandlers = {
    getEmpty: () =>
        http.get(`${API_BASE_URL}/cart`, () =>
            HttpResponse.json({ data: emptyCart, success: true }),
        ),

    getWithItem: () =>
        http.get(`${API_BASE_URL}/cart`, () =>
            HttpResponse.json({ data: cartWithOneItem, success: true }),
        ),

    addItem: () =>
        http.post(`${API_BASE_URL}/cart/items`, () =>
            HttpResponse.json({ data: cartWithOneItem, success: true }),
        ),

    addItemFails: (status = 400, message = "boxNotFound") =>
        http.post(`${API_BASE_URL}/cart/items`, () =>
            HttpResponse.json(
                { success: false, error: message },
                { status },
            ),
        ),

    updateQuantity: (newQty: number) =>
        http.put(`${API_BASE_URL}/cart/items/:itemId`, () =>
            HttpResponse.json({
                data: {
                    ...cartWithOneItem,
                    items: [{ ...cartWithOneItem.items[0], quantity: newQty }],
                },
                success: true,
            }),
        ),

    removeItem: () =>
        http.delete(`${API_BASE_URL}/cart/items/:itemId`, () =>
            HttpResponse.json({ data: emptyCart, success: true }),
        ),

    clear: () =>
        http.delete(`${API_BASE_URL}/cart`, () =>
            HttpResponse.json({ data: null, success: true }),
        ),

    unauthorized: () =>
        http.get(`${API_BASE_URL}/cart`, () =>
            HttpResponse.json(
                { success: false, error: "unauthorized" },
                { status: 401 },
            ),
        ),
};
