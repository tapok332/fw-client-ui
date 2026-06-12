"use client";

import {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState} from "react";
import {Cart, CartItem, Order, Store, SurpriseBox, SurpriseBox as ApiSurpriseBox, SurpriseBoxComponent as ComponentSurpriseBox, ZERO_MONEY} from "@/types";
import {api} from "@/lib/api";
import {sumMoney} from "@/lib/utils";
import {useToast} from "@/hooks/use-toast";
import {authHttpClient} from "@/lib/auth-http-client";
import {tokenStorage} from "@/lib/auth-api";

// Adapter to convert API SurpriseBox to Component SurpriseBox
const adaptBoxForComponent = (apiBox: ApiSurpriseBox): ComponentSurpriseBox => {
  return {
    id: apiBox.id,
    name: apiBox.name,
    image: apiBox.image,
    discount: apiBox.discount,
    timeLeft: apiBox.timeLeft,
    location: {
      lat: apiBox.location?.latitude ?? null,
      lng: apiBox.location?.longitude ?? null,
    },
    category: apiBox.category
  };
};

interface DataContextType {
    boxes: ComponentSurpriseBox[];
    apiBoxes: ApiSurpriseBox[];
    stores: Store[];
    cart: Cart;
    orders: Order[];
    isLoading: boolean;
    error: Error | null;
    addToCart: (box: ApiSurpriseBox, quantity?: number) => void;
    removeFromCart: (boxId: string) => void;
    updateCartItemQuantity: (boxId: string, quantity: number) => void;
    clearCart: () => void;
    createOrder: () => Promise<Order | null>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({children}: { children: ReactNode }) {
    // State for storing data
    const [apiBoxes, setApiBoxes] = useState<ApiSurpriseBox[]>([]);
    const [boxes, setBoxes] = useState<ComponentSurpriseBox[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [cart, setCart] = useState<Cart>({items: [], totalPrice: ZERO_MONEY});
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const {toast} = useToast();

    // Load data from the server on initialization
    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                // Fetch data from the server using the API
                const [boxesResult, storesData] = await Promise.all([
                    api.boxes.getAll(),
                    api.stores.getAll(),
                    // Categories are fetched separately in the Home component
                ]);
                
                if (!isMounted) return;
                
                // Extract boxes data from API response (api.boxes.getAll already unwraps .data)
                const boxesData: ApiSurpriseBox[] = Array.isArray(boxesResult) ? boxesResult : [];
                
                // Store original API boxes
                setApiBoxes(boxesData);
                
                // Convert to component format for use in UI
                const adaptedBoxes = boxesData.map(adaptBoxForComponent);
                setBoxes(adaptedBoxes);
                
                setStores(storesData);
                
            } catch (error) {
                console.error("Failed to fetch data:", error);
                
                if (!isMounted) return;
                
                // Fall back to empty arrays on error
                setApiBoxes([]);
                setBoxes([]);
                setStores([]);
                setError(error instanceof Error ? error : new Error('Failed to fetch data'));
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        
        const fetchOrders = async () => {
            try {
                // Only load orders if the user is authenticated
                const token = tokenStorage.getAccessToken();

                if (token) {
                    const response = await api.orders.getAll();
                    
                    if (!isMounted) return;
                    
                    // Backend returns PaginatedOrdersResponse: { orders, page, size, ... }
                    if (response && response.data && Array.isArray(response.data.orders)) {
                        setOrders(response.data.orders);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch orders:", error);
                
                // On error, fall back to orders from localStorage
                if (!isMounted) return;
                
                // Load orders from localStorage
                const savedOrders = localStorage.getItem('orders');
                if (savedOrders) {
                    try {
                        const parsedOrders = JSON.parse(savedOrders);
                        setOrders(parsedOrders);
                    } catch (error) {
                        console.error("Failed to parse orders from localStorage:", error);
                    }
                }
            }
        };
        
        fetchData();
        fetchOrders();
    
        // Load cart from localStorage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                setCart(parsedCart);
            } catch (error) {
                console.error("Failed to parse cart from localStorage:", error);
            }
        }
        
        return () => {
            isMounted = false;
        };
    }, []);

    // Persist cart to localStorage on change
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    // Persist orders to localStorage on change
    useEffect(() => {
        localStorage.setItem('orders', JSON.stringify(orders));
    }, [orders]);

    // Adds an item to the cart
    const addToCart = useCallback((box: SurpriseBox, quantity: number = 1) => {
        setCart(prevCart => {
            // Check if the item already exists in the cart
            const existingItem = prevCart.items.find(item => item.boxId === box.id);

            if (existingItem) {
                // Update the quantity of the existing item
                const updatedItems = prevCart.items.map(item =>
                    item.boxId === box.id
                        ? {...item, quantity: item.quantity + quantity}
                        : item
                );

                // Recalculate the total price
                const newTotalPrice = sumMoney(updatedItems, prevCart.totalPrice.currency);

                return {
                    items: updatedItems,
                    totalPrice: newTotalPrice
                };
            } else {
                // Add a new item to the cart
                const effectivePrice = box.discountedPrice ?? box.price;
                const newItem: CartItem = {
                    boxId: box.id,
                    name: box.name,
                    price: effectivePrice,
                    quantity,
                    storeId: box.storeId ?? '',
                    storeName: box.storeName ?? '',
                    image: box.image
                };

                // Recalculate the total price
                const newItems = [...prevCart.items, newItem];

                return {
                    items: newItems,
                    totalPrice: sumMoney(newItems, prevCart.totalPrice.currency)
                };
            }
        });

        // Notify the user
        toast({
            title: "Item added to cart",
            description: `${box.name} (${quantity} pcs)`,
        });
    }, [toast]);

    // Removes an item from the cart
    const removeFromCart = useCallback((boxId: string) => {
        setCart(prevCart => {
            // Find the item to remove
            const itemToRemove = prevCart.items.find(item => item.boxId === boxId);

            if (!itemToRemove) return prevCart;

            // Remove the item from the cart
            const updatedItems = prevCart.items.filter(item => item.boxId !== boxId);

            // Recalculate the total price
            return {
                items: updatedItems,
                totalPrice: sumMoney(updatedItems, prevCart.totalPrice.currency)
            };
        });
    }, []);

    // Updates an item's quantity in the cart
    const updateCartItemQuantity = useCallback((boxId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(boxId);
            return;
        }

        setCart(prevCart => {
            // Check if the item exists in the cart
            const existingItem = prevCart.items.find(item => item.boxId === boxId);

            if (!existingItem) return prevCart;

            // Update the item's quantity
            const updatedItems = prevCart.items.map(item =>
                item.boxId === boxId
                    ? {...item, quantity}
                    : item
            );

            // Recalculate the total price
            return {
                items: updatedItems,
                totalPrice: sumMoney(updatedItems, prevCart.totalPrice.currency)
            };
        });
    }, [removeFromCart]);

    // Clears the cart
    const clearCart = useCallback(() => {
        setCart({items: [], totalPrice: ZERO_MONEY});
    }, []);

    // Creates an order
    const createOrder = useCallback(async (): Promise<Order | null> => {
        // Make sure the cart is not empty
        if (cart.items.length === 0) {
            toast({
                title: "Error",
                description: "Cart is empty. Cannot create an order.",
                variant: "destructive",
            });
            return null;
        }

        try {
            // Prepare the request payload
            const orderData = {
                storeId: cart.items[0].storeId,
                items: cart.items.map(item => ({
                    surpriseBoxId: item.boxId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    deliveryAddress: '',
                    deliveryType: 'PICKUP',
                    paymentType: 'CARD',
                })),
            };

            // Create the order via the API
            const response = await api.orders.create(orderData);

            // Backend (Variant A): { order, paymentClientSecret?, paymentIntentId? }
            const newOrder = response.data?.order ?? null;
            if (!newOrder) {
                throw new Error("Server did not return order");
            }

            // Add the order to the orders list
            setOrders(prevOrders => [...prevOrders, newOrder]);

            // Clear the cart
            clearCart();

            // Notify the user
            toast({
                title: "Order created",
                description: `Order #${newOrder.id.substring(0, 8)} placed successfully`,
            });

            return newOrder;
        } catch (error) {
            console.error("Order creation failed:", error);
            toast({
                title: "Error",
                description: "Failed to create order. Please try again.",
                variant: "destructive",
            });
            return null;
        }
    }, [cart.items, clearCart, toast]);

    const contextValue = useMemo(() => ({
        boxes,
        apiBoxes,
        stores,
        cart,
        orders,
        isLoading,
        error,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        createOrder,
    }), [boxes, apiBoxes, stores, cart, orders, isLoading, error, addToCart, removeFromCart, updateCartItemQuantity, clearCart, createOrder]);

    return (
        <DataContext.Provider
            value={contextValue}
        >
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
}