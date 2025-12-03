const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Employees
  getAllEmployees: () => ipcRenderer.invoke('get-all-employees'),
  addEmployee: (data) => ipcRenderer.invoke('add-employee', data),
  updateEmployee: (id, data) => ipcRenderer.invoke('update-employee', id, data),
  deleteEmployee: (id) => ipcRenderer.invoke('delete-employee', id),

  // Customers
  getAllCustomers: () => ipcRenderer.invoke('get-all-customers'),
  addCustomer: (data) => ipcRenderer.invoke('add-customer', data),
  updateCustomer: (id, data) => ipcRenderer.invoke('update-customer', id, data),
  deleteCustomer: (id) => ipcRenderer.invoke('delete-customer', id),

  // Products
  getAllProducts: () => ipcRenderer.invoke('get-all-products'),
  addProduct: (data) => ipcRenderer.invoke('add-product', data),
  updateProduct: (id, data) => ipcRenderer.invoke('update-product', id, data),
  deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),

  // Categories
  getAllCategories: () => ipcRenderer.invoke('get-all-categories'),

  // Suppliers
  getAllSuppliers: () => ipcRenderer.invoke('get-all-suppliers'),

  // Sales
  getAllSales: () => ipcRenderer.invoke('get-all-sales'),
  addSale: (saleData, details) => ipcRenderer.invoke('add-sale', saleData, details),

  // Imports
  getAllImports: () => ipcRenderer.invoke('get-all-imports'),
  addImport: (importData, details) => ipcRenderer.invoke('add-import', importData, details),

  // Details
  getSaleDetails: (saleId) => ipcRenderer.invoke('get-sale-details', saleId),
  getImportDetails: (importId) => ipcRenderer.invoke('get-import-details', importId)
});