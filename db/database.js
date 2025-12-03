const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  user: "postgres",
  password: "vuthy123",
  database: "postgres",
  port: 5432
});

client.connect();

module.exports = {
  // Employees
  getAllEmployees: async () => {
    const result = await client.query("SELECT * FROM tblemployees ORDER BY empid");
    return result.rows;
  },

  addEmployee: async (data) => {
  const query = `
    INSERT INTO tblemployees 
    (empname, empgender, dob, position, salary, address, empcontact, hired_date, photo, stopwork) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING empid
  `;
  const values = [
    data.empname,
    data.empgender,
    data.dob,
    data.position,
    data.salary,
    data.address,
    data.empcontact,
    data.hired_date,
    data.photo || null,
    data.stopwork || false
  ];

  const result = await client.query(query, values);
  return result.rows[0].empid; // returns the auto-generated empID
},

  updateEmployee: async (id, data) => {
    const query = `
      UPDATE tblemployees SET 
      empname=$1, empgender=$2, dob=$3, position=$4, salary=$5, 
      address=$6, empcontact=$7, hired_date=$8, photo=$9, stopwork=$10 
      WHERE empid=$11
    `;
    const values = [
      data.empname,
      data.empgender,
      data.dob,
      data.position,
      data.salary,
      data.address,
      data.empcontact,
      data.hired_date,
      data.photo || null,
      data.stopwork || false,
      id
    ];
    await client.query(query, values);
  },

  deleteEmployee: async (id) => {
    await client.query("DELETE FROM tblemployees WHERE empid = $1", [id]);
  },

  // Customers
  getAllCustomers: async () => {
    const result = await client.query("SELECT * FROM tblcustomers ORDER BY cusid");
    return result.rows;
  },

  addCustomer: async (data) => {
    const query = `
      INSERT INTO tblcustomers (cusname, cusgender, cuscontact) 
      VALUES ($1, $2, $3) RETURNING cusid
    `;
    const values = [data.cusname, data.cusgender, data.cuscontact];
    const result = await client.query(query, values);
    return result.rows[0];
  },

  updateCustomer: async (id, data) => {
    const query = `
      UPDATE tblcustomers SET 
      cusname=$1, cusgender=$2, cuscontact=$3 
      WHERE cusid=$4
    `;
    const values = [data.cusname, data.cusgender, data.cuscontact, id];
    await client.query(query, values);
  },

  deleteCustomer: async (id) => {
    await client.query("DELETE FROM tblcustomers WHERE cusid = $1", [id]);
  },

  // Products
  getAllProducts: async () => {
    const result = await client.query(`
      SELECT p.*, c.category 
      FROM tblproducts p 
      JOIN tblcategories c ON p.catid = c.catid 
      ORDER BY p.proid
    `);
    return result.rows;
  },

  addProduct: async (data) => {
    const query = `
      INSERT INTO tblproducts (proname, qty, upis, sup, catid) 
      VALUES ($1, $2, $3, $4, $5)
          RETURNING proid
    `;
    const values = [
      data.proname,
      data.qty,
      data.upis,
      data.sup,
      data.catid
    ];
    const result = await client.query(query, values);
  return result.rows[0].proid; // returns the auto-generated empID
  },

  updateProduct: async (id, data) => {
    const query = `
      UPDATE tblproducts SET 
      proname=$1, qty=$2, upis=$3, sup=$4, catid=$5 
      WHERE proid=$6
    `;
    const values = [data.proname, data.qty, data.upis, data.sup, data.catid, id];
    await client.query(query, values);
  },

  deleteProduct: async (id) => {
    await client.query("DELETE FROM tblproducts WHERE proid = $1", [id]);
  },

  // Categories
  getAllCategories: async () => {
    const result = await client.query("SELECT * FROM tblcategories ORDER BY catid");
    return result.rows;
  },

  // Suppliers
  getAllSuppliers: async () => {
    const result = await client.query("SELECT * FROM tblsupplies ORDER BY supid");
    return result.rows;
  },

  // Sales
  getAllSales: async () => {
    const result = await client.query(`
      SELECT s.*, e.empname as employee_name, c.cusname as customer_name 
      FROM tblsales s 
      JOIN tblemployees e ON s.empid = e.empid 
      JOIN tblcustomers c ON s.cusid = c.cusid 
      ORDER BY s.saledate DESC
    `);
    return result.rows;
  },

  addSale: async (saleData, details) => {
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // Insert sale
      const saleQuery = `
        INSERT INTO tblsales 
        (saledate, empid, empname, cusid, cusname, saletotal) 
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING saleid
      `;
      const saleValues = [
        saleData.saledate,
        saleData.empid,
        saleData.empname,
        saleData.cusid,
        saleData.cusname,
        saleData.saletotal
      ];
      const saleResult = await client.query(saleQuery, saleValues);
      const saleId = saleResult.rows[0].saleid;
      
      // Insert sale details and update product quantities
      for (const detail of details) {
        // Insert detail
        const detailQuery = `
          INSERT INTO tblsaledetails 
          (saleid, proid, proname, saleqty, saleprice, saleamount) 
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await client.query(detailQuery, [
          saleId,
          detail.proid,
          detail.proname,
          detail.saleqty,
          detail.saleprice,
          detail.saleamount
        ]);
        
        // Update product quantity
        await client.query(
          "UPDATE tblproducts SET qty = qty - $1 WHERE proid = $2",
          [detail.saleqty, detail.proid]
        );
      }
      
      await client.query('COMMIT');
      return saleId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  },

  // Imports
  getAllImports: async () => {
    const result = await client.query(`
      SELECT i.*, e.empname as employee_name, s.supname as supplier_name 
      FROM tblimports i 
      JOIN tblemployees e ON i.empid = e.empid 
      JOIN tblsupplies s ON i.supid = s.supid 
      ORDER BY i.impdate DESC
    `);
    return result.rows;
  },

  addImport: async (importData, details) => {
    await client.query('BEGIN');
    
    try {
      // Insert import
      const importQuery = `
        INSERT INTO tblimports 
        (impdate, supid, supname, empid, empname, imptotal) 
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING impid
      `;
      const importValues = [
        importData.impdate,
        importData.supid,
        importData.supname,
        importData.empid,
        importData.empname,
        importData.imptotal
      ];
      const importResult = await client.query(importQuery, importValues);
      const importId = importResult.rows[0].impid;
      
      // Insert import details and update product quantities
      for (const detail of details) {
        // Insert detail
        const detailQuery = `
          INSERT INTO tblimportdetails 
          (impid, proid, proname, impqty, impprice, amount) 
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await client.query(detailQuery, [
          importId,
          detail.proid,
          detail.proname,
          detail.impqty,
          detail.impprice,
          detail.amount
        ]);
        
        // Update or insert product
        const productExists = await client.query(
          "SELECT * FROM tblproducts WHERE proid = $1",
          [detail.proid]
        );
        
        if (productExists.rows.length > 0) {
          // Update existing product quantity
          await client.query(
            "UPDATE tblproducts SET qty = qty + $1, upis = $2 WHERE proid = $3",
            [detail.impqty, detail.impprice, detail.proid]
          );
        } else {
          // Insert new product (you might need to handle category ID)
          await client.query(
            `INSERT INTO tblproducts (proid, proname, qty, upis, sup, catid) 
             VALUES ($1, $2, $3, $4, $5, 1)`, // Default catid = 1
            [
              detail.proid,
              detail.proname,
              detail.impqty,
              detail.impprice,
              detail.impprice * 0.8 // Example calculation for sup price
            ]
          );
        }
      }
      
      await client.query('COMMIT');
      return importId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  },

  // Get sale/import details
  getSaleDetails: async (saleId) => {
    const result = await client.query(
      "SELECT * FROM tblsaledetails WHERE saleid = $1",
      [saleId]
    );
    return result.rows;
  },

  getImportDetails: async (importId) => {
    const result = await client.query(
      "SELECT * FROM tblimportdetails WHERE impid = $1",
      [importId]
    );
    return result.rows;
  }
};