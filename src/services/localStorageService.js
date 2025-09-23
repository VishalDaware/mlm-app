
import { v4 as uuidv4 } from 'uuid';

const DB_KEY = 'mlmDatabase';

const getInitialData = () => ({

  users: [
    { userId: 'admin', password: 'password', role: 'Admin', name: 'Admin User' },
    { userId: 'DIS3309', password: 'password', role: 'Distributor', name: 'Kishor', upline: 'admin' },
    { userId: 'DLR789', password: 'password', role: 'Dealer', name: 'Rohan', upline: 'DIS3309' },
    { userId: 'DLR790', password: 'password', role: 'Dealer', name: 'Ved', upline: 'DIS3309' },
    { userId: 'FRM456', password: 'password', role: 'Farmer', name: 'Aditya', upline: 'DLR789' }
  ],
  products: [
    { id: uuidv4(), name: 'Organic Fertilizer', price: 500.00, stock: 100 },
    { id: uuidv4(), name: 'Soilmaster', price: 35000.00, stock: 10 },
    { id: uuidv4(), name: 'Pest Control Spray', price: 800.00, stock: 200 },
    { id: uuidv4(), name: 'Moisture Unit', price: 1250.00, stock: 50 },
  ],
  sales: [],
});

export const initDatabase = () => {
  if (!localStorage.getItem(DB_KEY)) {
    localStorage.setItem(DB_KEY, JSON.stringify(getInitialData()));
  }
};

const getDatabase = () => {
  return JSON.parse(localStorage.getItem(DB_KEY));
};

export const getUsers = () => {
  const db = getDatabase();
  return db.users;
};

// NEW: Function to find a single user by their ID
export const getUserById = (userId) => {
    const db = getDatabase();
    return db.users.find(user => user.userId.toLowerCase() === userId.toLowerCase());
};

export const getProducts = () => {
    const db = getDatabase();
    return db.products;
};

export const addProduct = (productData) => {
  const db = getDatabase();
  const newProduct = {
    id: uuidv4(),
    ...productData,
  };
  db.products.push(newProduct);
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db.products;
};

// Update an existing product
export const updateProduct = (productId, updatedData) => {
  const db = getDatabase();
  const productIndex = db.products.findIndex((p) => p.id === productId);
  if (productIndex > -1) {
    db.products[productIndex] = { ...db.products[productIndex], ...updatedData };
  }
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db.products;
};

// Delete a product
export const deleteProduct = (productId) => {
  const db = getDatabase();
  db.products = db.products.filter((p) => p.id !== productId);
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db.products;
};


export const addUser = (userData, uplineId) => {
  const db = getDatabase();
  const newUser = {
    ...userData,
    userId: `${userData.role.substring(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`, // Generate a random ID
    password: 'password', // Default password
    upline: uplineId,
  };
  db.users.push(newUser);
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return newUser;
};

// Get all users directly under a specific user
export const getDownline = (userId) => {
  const db = getDatabase();
  return db.users.filter(user => user.upline === userId);
};

// Create a new sale and calculate commissions
export const createSale = (saleData) => {
  const { sellerId, productId, quantity } = saleData;
  const db = getDatabase();
  
  const product = db.products.find(p => p.id === productId);
  const seller = db.users.find(u => u.userId === sellerId);

  if (!product || !seller || product.stock < quantity) {
    console.error("Sale cannot be completed. Check product, seller, or stock.");
    return null; // Sale failed
  }

  // Update product stock
  product.stock -= quantity;

  // Calculate commissions (e.g., 10% for dealer, 5% for distributor)
  const totalAmount = product.price * quantity;
  const sellerCommissionRate = seller.role === 'Dealer' ? 0.10 : 0.15; // Dealers get 10%, Distributors 15%
  const uplineCommissionRate = 0.05; // 5% for the upline

  const sellerCommission = totalAmount * sellerCommissionRate;
  
  let uplineCommission = 0;
  if (seller.upline) {
      uplineCommission = totalAmount * uplineCommissionRate;
  }

  const newSale = {
    id: uuidv4(),
    ...saleData,
    totalAmount,
    sellerCommission,
    uplineCommission,
    uplineId: seller.upline,
    date: new Date().toISOString(),
  };

  db.sales.push(newSale);
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return newSale;
};

// Get all sales related to a user (as seller or upline)
export const getSalesForUser = (userId) => {
    const db = getDatabase();
    return db.sales.filter(sale => sale.sellerId === userId || sale.uplineId === userId);
};

// Get all sales records
export const getSales = () => {
  const db = getDatabase();
  return db.sales;
};


// Fetches a user and their entire downline in a nested structure
export const getHierarchy = (userId) => {
  const allUsers = getUsers();
  
  // A helper function to recursively find children for a given parentId
  const findChildren = (parentId) => {
    const children = allUsers.filter(user => user.upline === parentId);
    // For each child found, recursively find their children
    return children.map(child => ({
      ...child,
      children: findChildren(child.userId), // Recursion happens here
    }));
  };

  const rootUser = allUsers.find(user => user.userId.toLowerCase() === userId.toLowerCase());
  if (!rootUser) {
    return null; // User not found
  }

  // Return the root user with their complete, nested downline
  return {
    ...rootUser,
    children: findChildren(rootUser.userId),
  };
};