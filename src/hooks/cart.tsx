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
      // await AsyncStorage.clear();
      const productsStorage = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );
      setProducts(productsStorage ? [...JSON.parse(productsStorage)] : []);
    }

    loadProducts();
  }, []);

  // useEffect(() => {
  //   async function setProductsInStorage(): Promise<void> {
  //     await AsyncStorage.setItem(
  //       '@GoMarketplace:products',
  //       JSON.stringify(products),
  //     );
  //   }
  //   setProductsInStorage();
  // }, [products]);

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
        increment(product.id);
        return;
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
