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
      const productsStored = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );
      if (productsStored) setProducts(JSON.parse(productsStored));
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async (id: string) => {
      const newProductsList = products.map(p =>
        p.id === id ? { ...p, quantity: p.quantity + 1 } : p,
      );
      setProducts(newProductsList);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProductsList),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async (id: string) => {
      const newProductsList = products
        .map(p => (p.id === id ? { ...p, quantity: p.quantity - 1 } : p))
        .filter(p => p.quantity > 0);

      setProducts(newProductsList);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProductsList),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const findedProducts = products.filter(p => p.id === product.id);

      if (!findedProducts.length) {
        const newProductList = [...products, { ...product, quantity: 1 }];
        setProducts(newProductList);

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(newProductList),
        );
      } else {
        await increment(product.id);
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
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
