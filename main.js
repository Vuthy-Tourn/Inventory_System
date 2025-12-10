const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./db/database.js');
require('electron-reload')(__dirname);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('./renderer/index.html');
}

app.whenReady().then(createWindow);

// IPC Handlers
// Employees
ipcMain.handle('get-all-employees', async () => {
  return await db.getAllEmployees();
});

ipcMain.handle('add-employee', async (event, data) => {
  return await db.addEmployee(data);
});

ipcMain.handle('update-employee', async (event, id, data) => {
  return await db.updateEmployee(id, data);
});

ipcMain.handle('delete-employee', async (event, id) => {
  return await db.deleteEmployee(id);
});

// Customers
ipcMain.handle('get-all-customers', async () => {
  return await db.getAllCustomers();
});

ipcMain.handle('add-customer', async (event, data) => {
  return await db.addCustomer(data);
});

ipcMain.handle('update-customer', async (event, id, data) => {
  return await db.updateCustomer(id, data);
});

ipcMain.handle('delete-customer', async (event, id) => {
  return await db.deleteCustomer(id);
});

// Products
ipcMain.handle('get-all-products', async () => {
  return await db.getAllProducts();
});

ipcMain.handle('add-product', async (event, data) => {
  return await db.addProduct(data);
});

ipcMain.handle('update-product', async (event, id, data) => {
  return await db.updateProduct(id, data);
});

ipcMain.handle('delete-product', async (event, id) => {
  return await db.deleteProduct(id);
});

// Categories
ipcMain.handle('get-all-categories', async () => {
  return await db.getAllCategories();
});

// Suppliers
ipcMain.handle('get-all-suppliers', async () => {
  return await db.getAllSuppliers();
});

// Sales
ipcMain.handle('get-all-sales', async () => {
  return await db.getAllSales();
});

ipcMain.handle('add-sale', async (event, saleData, details) => {
  return await db.addSale(saleData, details);
});

// Imports
ipcMain.handle('get-all-imports', async () => {
  return await db.getAllImports();
});

ipcMain.handle('add-import', async (event, importData, details) => {
  return await db.addImport(importData, details);
});

// Details
ipcMain.handle('get-sale-details', async (event, saleId) => {
  return await db.getSaleDetails(saleId);
});

ipcMain.handle('get-import-details', async (event, importId) => {
  return await db.getImportDetails(importId);
});