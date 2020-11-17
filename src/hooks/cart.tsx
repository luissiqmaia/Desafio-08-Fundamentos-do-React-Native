/* eslint-disable no-param-reassign */
import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): Promise<void>;
  increment(id: string): Promise<void>;
  decrement(id: string): Promise<void>;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      try {
        const productsStorage = await AsyncStorage.getItem(
          '@GoMarketplace:products',
        );
        setProducts(productsStorage ? [...JSON.parse(productsStorage)] : []);
      } catch (err) {
        console.log('Hooks cart', err);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async (id: string): Promise<void> => {
      const newProducts = products.map(p =>
        p.id === id ? { ...p, quantity: p.quantity + 1 } : p,
      );
      setProducts(newProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product): Promise<void> => {
      const productIndex = products.findIndex(p => p.id === product.id);

      if (productIndex >= 0) {
        await increment(product.id);
      }
      const newProducts = [...products, { ...product, quantity: 1 }];
      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products, increment],
  );

  const decrement = useCallback(
    async (id: string): Promise<void> => {
      let newProducts = [] as Product[];
      const productIndex = products.findIndex(p => p.id === id);

      if (products[productIndex].quantity > 1) {
        newProducts = products.map(p =>
          p.id === id ? { ...p, quantity: p.quantity - 1 } : p,
        );
      } else {
        newProducts = products.filter(p => p.id !== id);
      }
      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({
      addToCart,
      increment,
      decrement,
      products,
    }),
    [addToCart, increment, decrement, products],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
