// Modal Management System
function createModal(title, content, onSubmit = null) {
    // Close existing modal if any
    if (activeModal) {
        activeModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 text-2xl">
                    &times;
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            ${onSubmit ? `
                <div class="modal-footer">
                    <button onclick="closeModal()" class="btn btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" form="modalForm" class="btn btn-primary">
                        Save Changes
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    document.body.appendChild(modal);
    activeModal = modal;
    setupModalClickOutside(modal);
    
    // Focus first input
    setTimeout(() => {
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) firstInput.focus();
    }, 100);
    
    return modal;
}

// Dashboard functions
async function loadDashboard() {
    try {
        const [employees, customers, products] = await Promise.all([
            window.api.getAllEmployees(),
            window.api.getAllCustomers(),
            window.api.getAllProducts()
        ]);
        
        document.getElementById('total-employees').textContent = employees.length;
        document.getElementById('total-customers').textContent = customers.length;
        document.getElementById('total-products').textContent = products.length;
        
        // Update recent activity
        const activityElement = document.getElementById('recent-activity');
        const activities = [
            `System loaded with ${employees.length} employees`,
            `${customers.length} customers in database`,
            `${products.length} products in inventory`
        ];
        
        activityElement.innerHTML = activities.map(activity => `
            <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                <i class="fas fa-info-circle text-blue-500 mr-3"></i>
                <span class="text-gray-700">${activity}</span>
            </div>
        `).join('');
        
    } catch (error) {
        showToast('Error loading dashboard data', 'error');
    }
}

// Customers
async function loadCustomers() {
    try {
        const table = document.getElementById('customers-table');
        table.innerHTML = `
            <tr>
                <td colspan="5" class="table-cell text-center py-12">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-spinner loading-spinner text-3xl text-blue-500 mb-4"></i>
                        <p class="text-gray-600">Loading customers...</p>
                    </div>
                </td>
            </tr>
        `;
        
        const customers = await window.api.getAllCustomers();
        
        if (customers.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="table-cell text-center py-12">
                        <div class="empty-state">
                            <i class="fas fa-user-slash empty-state-icon"></i>
                            <p class="text-gray-600">No customers found</p>
                            <button onclick="showCustomerModal()" class="btn btn-primary mt-4">
                                <i class="fas fa-plus mr-2"></i>Add First Customer
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        table.innerHTML = '';
        
        customers.forEach(cus => {
            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td class="table-cell font-medium">${cus.cusid}</td>
                <td class="table-cell font-medium">${cus.cusname}</td>
                <td class="table-cell">${cus.cusgender || 'N/A'}</td>
                <td class="table-cell">${cus.cuscontact || 'N/A'}</td>
                <td class="table-cell">
                    <div class="flex items-center space-x-2">
                        <button onclick="editCustomer(${cus.cusid})" 
                                class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteCustomer(${cus.cusid})" 
                                class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            table.appendChild(row);
        });
        
    } catch (error) {
        showToast('Error loading customers', 'error');
    }
}

function showCustomerModal(customer = null) {
    const title = customer ? 'Edit Customer' : 'Add New Customer';
    const content = `
        <form id="modalForm" class="space-y-4">
            <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input type="text" name="cusname" required 
                       class="form-input"
                       value="${customer ? customer.cusname : ''}"
                       placeholder="John Doe">
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group">
                    <label class="form-label">Gender</label>
                    <select name="cusgender" class="form-select">
                        <option value="">Select Gender</option>
                        <option value="M" ${customer && customer.cusgender === 'M' ? 'selected' : ''}>Male</option>
                        <option value="F" ${customer && customer.cusgender === 'F' ? 'selected' : ''}>Female</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Contact</label>
                    <input type="text" name="cuscontact" 
                           class="form-input"
                           value="${customer ? customer.cuscontact : ''}"
                           placeholder="+1 (555) 123-4567">
                </div>
            </div>
        </form>
    `;
    
    const modal = createModal(title, content, true);
    
    const form = modal.querySelector('#modalForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        try {
            const submitBtn = modal.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-spinner loading-spinner mr-2"></i>Saving...';
            submitBtn.disabled = true;
            
            if (customer) {
                await window.api.updateCustomer(customer.cusid, data);
                showToast('Customer updated successfully!', 'success');
            } else {
                await window.api.addCustomer(data);
                showToast('Customer added successfully!', 'success');
            }
            
            closeModal();
            loadCustomers();
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
            const submitBtn = modal.querySelector('button[type="submit"]');
            submitBtn.innerHTML = 'Save Changes';
            submitBtn.disabled = false;
        }
    });
}

async function editCustomer(id) {
    try {
        const customers = await window.api.getAllCustomers();
        const customer = customers.find(c => c.cusid === id);
        if (customer) {
            showCustomerModal(customer);
        }
    } catch (error) {
        showToast('Error loading customer data', 'error');
    }
}

async function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        try {
            await window.api.deleteCustomer(id);
            showToast('Customer deleted successfully!', 'success');
            loadCustomers();
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    }
}

// Products
async function loadProducts() {
    try {
        const table = document.getElementById('products-table');
        table.innerHTML = `
            <tr>
                <td colspan="7" class="table-cell text-center py-12">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-spinner loading-spinner text-3xl text-blue-500 mb-4"></i>
                        <p class="text-gray-600">Loading products...</p>
                    </div>
                </td>
            </tr>
        `;
        
        const products = await window.api.getAllProducts();
        
        if (products.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="7" class="table-cell text-center py-12">
                        <div class="empty-state">
                            <i class="fas fa-box-open empty-state-icon"></i>
                            <p class="text-gray-600">No products found</p>
                            <button onclick="showProductModal()" class="btn btn-primary mt-4">
                                <i class="fas fa-plus mr-2"></i>Add First Product
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        table.innerHTML = '';
        
        products.forEach(prod => {
            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td class="table-cell font-medium">${prod.proid}</td>
                <td class="table-cell font-medium">${prod.proname}</td>
                <td class="table-cell">${prod.qty}</td>
                <td class="table-cell font-medium">$${parseFloat(prod.upis).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td class="table-cell">$${parseFloat(prod.sup).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td class="table-cell">${prod.category || 'N/A'}</td>
                <td class="table-cell">
                    <div class="flex items-center space-x-2">
                        <button onclick="editProduct(${prod.proid})" 
                                class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteProduct(${prod.proid})" 
                                class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            table.appendChild(row);
        });
        
    } catch (error) {
        showToast('Error loading products', 'error');
    }
}

// Sales
async function loadSales() {
    try {
        const sales = await window.api.getAllSales();
        const table = document.getElementById('sales-table');
        // Similar implementation as other tables
    } catch (error) {
        showToast('Error loading sales', 'error');
    }
}

// Imports
async function loadImports() {
    try {
        const imports = await window.api.getAllImports();
        const table = document.getElementById('imports-table');
        // Similar implementation as other tables
    } catch (error) {
        showToast('Error loading imports', 'error');
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});

// Employees
async function loadEmployees() {
    try {
        const table = document.getElementById('employees-table');
        table.innerHTML = `
            <tr>
                <td colspan="8" class="table-cell text-center py-12">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-spinner loading-spinner text-3xl text-blue-500 mb-4"></i>
                        <p class="text-gray-600">Loading employees...</p>
                    </div>
                </td>
            </tr>
        `;
        
        const employees = await window.api.getAllEmployees();
        
        if (employees.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="8" class="table-cell text-center py-12">
                        <div class="empty-state">
                            <i class="fas fa-users-slash empty-state-icon"></i>
                            <p class="text-gray-600">No employees found</p>
                            <button onclick="showEmployeeModal()" class="btn btn-primary mt-4">
                                <i class="fas fa-plus mr-2"></i>Add First Employee
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        table.innerHTML = '';
        
        employees.forEach(emp => {
            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td class="table-cell font-medium">${emp.empid}</td>
                <td class="table-cell font-medium">${emp.empname}</td>
                <td class="table-cell">${emp.empgender === 'M' ? 'Male' : 'Female'}</td>
                <td class="table-cell">${emp.position}</td>
                <td class="table-cell font-medium">$${parseFloat(emp.salary).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td class="table-cell">${new Date(emp.hired_date).toLocaleDateString()}</td>
                <td class="table-cell">
                    <span class="status-badge ${emp.stopwork ? 'status-inactive' : 'status-active'}">
                        <i class="fas ${emp.stopwork ? 'fa-user-slash' : 'fa-user-check'} mr-1"></i>
                        ${emp.stopwork ? 'Inactive' : 'Active'}
                    </span>
                </td>
                <td class="table-cell">
                    <div class="flex items-center space-x-2">
                        <button onclick="editEmployee(${emp.empid})" 
                                class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteEmployee(${emp.empid})" 
                                class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            table.appendChild(row);
        });
        
    } catch (error) {
        const table = document.getElementById('employees-table');
        table.innerHTML = `
            <tr>
                <td colspan="8" class="table-cell text-center py-12">
                    <div class="flex flex-col items-center text-red-600">
                        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                        <p class="font-medium">Error loading employees</p>
                        <p class="text-sm text-gray-600 mt-1">${error.message}</p>
                    </div>
                </td>
            </tr>
        `;
        showToast('Error loading employees', 'error');
    }
}

async function searchEmployees() {
    const searchTerm = document.getElementById('search-employee').value.toLowerCase();
    const table = document.getElementById('employees-table');
    const rows = table.querySelectorAll('.table-row');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function showEmployeeModal(employee = null) {
    const title = employee ? 'Edit Employee' : 'Add New Employee';
    
    // Add styles once
    addImageUploadStyles();
    
    // Format dates for input fields (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };
    
    // Create image upload component
    const imageUpload = createImageUploadComponent({
        existingImage: employee ? employee.photo : '',
        label: 'Profile Photo'
    });
    
    const content = `
        <form id="modalForm" class="space-y-6">
            <div class="flex flex-col md:flex-row gap-8">
                <!-- Left Column: Profile Photo & Status -->
                <div class="md:w-1/3 space-y-4">
                    ${imageUpload.html}
                    
                    <!-- Status Section -->
                    <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-3">Employment Status</h3>
                        <label class="flex items-center p-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                            <input type="checkbox" name="stopwork" 
                                   class="mr-3 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                   ${employee && employee.stopwork ? 'checked' : ''}>
                            <div>
                                <span class="text-gray-700 font-medium text-sm">Mark as Inactive</span>
                                <p class="text-xs text-gray-500 mt-1">Employee is no longer working</p>
                            </div>
                        </label>
                    </div>
                </div>
                
                <!-- Right Column: Employee Details -->
                <div class="md:w-2/3">
                    <div class="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-6">Personal Information</h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="form-group">
                                <label class="form-label flex items-center">
                                    <span>Full Name</span>
                                    <span class="text-red-500 ml-1">*</span>
                                </label>
                                <div class="relative">
                                    <i class="fas fa-user absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    <input type="text" name="empname" required 
                                           class="form-input pl-10"
                                           value="${employee ? employee.empname : ''}"
                                           placeholder="John Doe">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label flex items-center">
                                    <span>Gender</span>
                                    <span class="text-red-500 ml-1">*</span>
                                </label>
                                <div class="relative">
                                    <i class="fas fa-venus-mars absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    <select name="empgender" required class="form-select pl-10">
                                        <option value="">Select Gender</option>
                                        <option value="M" ${employee && employee.empgender === 'M' ? 'selected' : ''}>Male</option>
                                        <option value="F" ${employee && employee.empgender === 'F' ? 'selected' : ''}>Female</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label flex items-center">
                                    <span>Date of Birth</span>
                                    <span class="text-red-500 ml-1">*</span>
                                </label>
                                <div class="relative">
                                    <i class="fas fa-calendar-day absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    <input type="date" name="dob" required 
                                           class="form-input pl-10"
                                           value="${formatDateForInput(employee ? employee.dob : '')}">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label flex items-center">
                                    <span>Position</span>
                                    <span class="text-red-500 ml-1">*</span>
                                </label>
                                <div class="relative">
                                    <i class="fas fa-briefcase absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    <input type="text" name="position" required 
                                           class="form-input pl-10"
                                           value="${employee ? employee.position : ''}"
                                           placeholder="Manager">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label flex items-center">
                                    <span>Salary</span>
                                    <span class="text-red-500 ml-1">*</span>
                                </label>
                                <div class="relative">
                                    <i class="fas fa-dollar-sign absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    <input type="number" name="salary" step="0.01" required 
                                           class="form-input pl-10"
                                           value="${employee ? employee.salary : ''}"
                                           placeholder="50000.00">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label flex items-center">
                                    <span>Hired Date</span>
                                    <span class="text-red-500 ml-1">*</span>
                                </label>
                                <div class="relative">
                                    <i class="fas fa-calendar-check absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    <input type="date" name="hired_date" required 
                                           class="form-input pl-10"
                                           value="${formatDateForInput(employee ? employee.hired_date : '')}">
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-6">
                            <div class="form-group">
                                <label class="form-label flex items-center">
                                    <span>Address</span>
                                    <span class="text-red-500 ml-1">*</span>
                                </label>
                                <div class="relative">
                                    <i class="fas fa-map-marker-alt absolute left-3 top-3 text-gray-400"></i>
                                    <textarea name="address" required class="form-textarea pl-10" rows="3">${employee ? employee.address : ''}</textarea>
                                </div>
                            </div>
                            
                            <div class="form-group mt-6">
                                <label class="form-label flex items-center">
                                    <span>Contact Number</span>
                                </label>
                                <div class="relative">
                                    <i class="fas fa-phone absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    <input type="text" name="empcontact" 
                                           class="form-input pl-10"
                                           value="${employee ? employee.empcontact : ''}"
                                           placeholder="(+855) 123-4567">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    `;
    
    const modal = createModal(title, content, true);
    
    // IMPORTANT: Wait for the modal to be fully rendered before setting up
    setTimeout(() => {
        // Setup image upload component AFTER the modal is in the DOM
        imageUpload.setup();
    }, 0);
    
    const form = modal.querySelector('#modalForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Get the photo data from the image upload component
        data.photo = imageUpload.getImage() || null;
        
        // Convert checkbox value to boolean
        data.stopwork = data.stopwork === 'on';
        
        // Convert numeric fields
        data.salary = parseFloat(data.salary);
        
        // Format dates properly before sending
        if (data.dob) {
            data.dob = new Date(data.dob).toISOString().split('T')[0];
        }
        if (data.hired_date) {
            data.hired_date = new Date(data.hired_date).toISOString().split('T')[0];
        }
        
        try {
            const submitBtn = modal.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
            submitBtn.disabled = true;
            
            if (employee) {
                await window.api.updateEmployee(employee.empid, data);
                showToast('Employee updated successfully!', 'success');
            } else {
                await window.api.addEmployee(data);
                showToast('Employee added successfully!', 'success');
            }
            
            closeModal();
            loadEmployees();
        } catch (error) {
            console.error('Error saving employee:', error);
            showToast(`Error: ${error.message}`, 'error');
            const submitBtn = modal.querySelector('button[type="submit"]');
            submitBtn.innerHTML = 'Save Changes';
            submitBtn.disabled = false;
        }
    });
}

async function editEmployee(id) {
    try {
        const employees = await window.api.getAllEmployees();
        const employee = employees.find(e => e.empid === id);
        if (employee) {
            showEmployeeModal(employee);
        }
    } catch (error) {
        showToast('Error loading employee data', 'error');
    }
}

async function deleteEmployee(id) {
    if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
        try {
            await window.api.deleteEmployee(id);
            showToast('Employee deleted successfully!', 'success');
            loadEmployees();
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    }
}

// Products - Complete Implementation
async function loadProducts() {
    try {
        const table = document.getElementById('products-table');
        table.innerHTML = `
            <tr>
                <td colspan="7" class="table-cell text-center py-12">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-spinner loading-spinner text-3xl text-blue-500 mb-4"></i>
                        <p class="text-gray-600">Loading products...</p>
                    </div>
                </td>
            </tr>
        `;
        
        const products = await window.api.getAllProducts();
        
        if (products.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="7" class="table-cell text-center py-12">
                        <div class="empty-state">
                            <i class="fas fa-box-open empty-state-icon"></i>
                            <p class="text-gray-600">No products found</p>
                            <button onclick="showProductModal()" class="btn btn-primary mt-4">
                                <i class="fas fa-plus mr-2"></i>Add First Product
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        table.innerHTML = '';
        
        products.forEach(prod => {
            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td class="table-cell font-medium">${prod.proid}</td>
                <td class="table-cell font-medium">${prod.proname}</td>
                <td class="table-cell">
                    <span class="px-2 py-1 text-xs rounded-full ${prod.qty > 10 ? 'bg-green-100 text-green-800' : prod.qty > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                        ${prod.qty}
                    </span>
                </td>
                <td class="table-cell font-medium">$${parseFloat(prod.upis).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td class="table-cell">$${parseFloat(prod.sup).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td class="table-cell">
                    <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        ${prod.category || 'N/A'}
                    </span>
                </td>
                <td class="table-cell">
                    <div class="flex items-center space-x-2">
                        <button onclick="editProduct(${prod.proid})" 
                                class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteProduct(${prod.proid})" 
                                class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            table.appendChild(row);
        });
        
    } catch (error) {
        showToast('Error loading products', 'error');
    }
}

function showProductModal(product = null) {
    const title = product ? 'Edit Product' : 'Add New Product';
    
    // Get categories for dropdown
    window.api.getAllCategories().then(categories => {
        const categoryOptions = categories.map(cat => 
            `<option value="${cat.catid}" ${product && product.catid == cat.catid ? 'selected' : ''}>${cat.category}</option>`
        ).join('');
        
        const content = `
            <form id="modalForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="form-label">Product Name *</label>
                        <input type="text" name="proname" required 
                               class="form-input"
                               value="${product ? product.proname : ''}"
                               placeholder="Product Name">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Quantity *</label>
                        <input type="number" name="qty" required 
                               class="form-input"
                               value="${product ? product.qty : 0}"
                               min="0"
                               placeholder="100">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Unit Price (UPIS) *</label>
                        <input type="number" name="upis" step="0.01" required 
                               class="form-input"
                               value="${product ? product.upis : ''}"
                               placeholder="29.99">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Supplier Price (SUP) *</label>
                        <input type="number" name="sup" step="0.01" required 
                               class="form-input"
                               value="${product ? product.sup : ''}"
                               placeholder="19.99">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Category *</label>
                        <select name="catid" required class="form-select">
                            <option value="">Select Category</option>
                            ${categoryOptions}
                        </select>
                    </div>
                </div>
            </form>
        `;
        
        const modal = createModal(title, content, true);
        
        const form = modal.querySelector('#modalForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // Convert numeric fields
            data.qty = parseInt(data.qty);
            data.upis = parseFloat(data.upis);
            data.sup = parseFloat(data.sup);
            data.catid = parseInt(data.catid);
            
            try {
                const submitBtn = modal.querySelector('button[type="submit"]');
                submitBtn.innerHTML = '<i class="fas fa-spinner loading-spinner mr-2"></i>Saving...';
                submitBtn.disabled = true;
                
                if (product) {
                    await window.api.updateProduct(data.proid, data);
                    showToast('Product updated successfully!', 'success');
                } else {
                    await window.api.addProduct(data);
                    showToast('Product added successfully!', 'success');
                }
                
                closeModal();
                loadProducts();
            } catch (error) {
                showToast(`Error: ${error.message}`, 'error');
                const submitBtn = modal.querySelector('button[type="submit"]');
                submitBtn.innerHTML = 'Save Changes';
                submitBtn.disabled = false;
            }
        });
    }).catch(error => {
        showToast('Error loading categories', 'error');
    });
}

async function editProduct(id) {
    try {
        const products = await window.api.getAllProducts();
        const product = products.find(p => p.proid === id);
        if (product) {
            showProductModal(product);
        }
    } catch (error) {
        showToast('Error loading product data', 'error');
    }
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await window.api.deleteProduct(id);
            showToast('Product deleted successfully!', 'success');
            loadProducts();
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    }
}

// Sales - Complete Implementation
async function loadSales() {
    try {
        const sales = await window.api.getAllSales();
        const table = document.getElementById('sales-table');
        
        if (!sales || sales.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="6" class="table-cell text-center py-12">
                        <div class="empty-state">
                            <i class="fas fa-shopping-cart empty-state-icon"></i>
                            <p class="text-gray-600">No sales found</p>
                            <button onclick="showSaleModal()" class="btn btn-primary mt-4">
                                <i class="fas fa-plus mr-2"></i>Create First Sale
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        table.innerHTML = '';
        
        sales.forEach(sale => {
            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td class="table-cell font-medium">${sale.saleid}</td>
                <td class="table-cell">${new Date(sale.saledate).toLocaleString()}</td>
                <td class="table-cell">${sale.empname || sale.employee_name}</td>
                <td class="table-cell">${sale.cusname || sale.customer_name}</td>
                <td class="table-cell font-medium text-green-600">$${parseFloat(sale.saletotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td class="table-cell">
                    <div class="flex items-center space-x-2">
                        <button onclick="viewSaleDetails(${sale.saleid})" 
                                class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="deleteSale(${sale.saleid})" 
                                class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            table.appendChild(row);
        });
        
    } catch (error) {
        showToast('Error loading sales', 'error');
    }
}

function showSaleModal() {
    const title = 'Create New Sale';
    
    // Get data for dropdowns
    Promise.all([
        window.api.getAllEmployees(),
        window.api.getAllCustomers(),
        window.api.getAllProducts()
    ]).then(([employees, customers, products]) => {
        
        const employeeOptions = employees.map(emp => 
            `<option value="${emp.empid}">${emp.empname} (${emp.empid})</option>`
        ).join('');
        
        const customerOptions = customers.map(cus => 
            `<option value="${cus.cusid}">${cus.cusname}</option>`
        ).join('');
        
        const productOptions = products.filter(p => p.qty > 0).map(prod => 
            `<option value="${prod.proid}" data-price="${prod.upis}" data-name="${prod.proname}">${prod.proname} ($${prod.upis}) - Stock: ${prod.qty}</option>`
        ).join('');
        
        const content = `
            <form id="modalForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="form-label">Sale Date *</label>
                        <input type="datetime-local" name="saledate" required 
                               class="form-input"
                               value="${new Date().toISOString().slice(0, 16)}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Employee *</label>
                        <select name="empid" required class="form-select" onchange="updateEmployeeName(this)">
                            <option value="">Select Employee</option>
                            ${employeeOptions}
                        </select>
                        <input type="hidden" name="empname" id="empname">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Customer *</label>
                        <select name="cusid" required class="form-select" onchange="updateCustomerName(this)">
                            <option value="">Select Customer</option>
                            ${customerOptions}
                        </select>
                        <input type="hidden" name="cusname" id="cusname">
                    </div>
                </div>
                
                <div class="border-t pt-4">
                    <h4 class="font-medium text-gray-700 mb-3">Sale Items</h4>
                    <div id="sale-items-container">
                        <div class="sale-item grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <label class="form-label">Product</label>
                                <select name="products[]" required class="form-select product-select" onchange="updateProductDetails(this)">
                                    <option value="">Select Product</option>
                                    ${productOptions}
                                </select>
                            </div>
                            <div>
                                <label class="form-label">Quantity</label>
                                <input type="number" name="quantities[]" required 
                                       class="form-input quantity-input" min="1" value="1" 
                                       onchange="calculateItemTotal(this)">
                            </div>
                            <div>
                                <label class="form-label">Unit Price</label>
                                <input type="number" name="prices[]" required 
                                       class="form-input price-input" step="0.01" 
                                       onchange="calculateItemTotal(this)">
                            </div>
                            <div>
                                <label class="form-label">Total</label>
                                <input type="text" class="form-input item-total" readonly value="$0.00">
                                <input type="hidden" name="amounts[]" class="amount-input" value="0">
                            </div>
                        </div>
                    </div>
                    
                    <button type="button" onclick="addSaleItem()" class="btn btn-secondary mb-4">
                        <i class="fas fa-plus mr-2"></i>Add Item
                    </button>
                </div>
                
                <div class="border-t pt-4">
                    <div class="flex justify-between items-center">
                        <span class="text-lg font-medium">Total Amount:</span>
                        <span id="sale-total" class="text-2xl font-bold text-green-600">$0.00</span>
                        <input type="hidden" name="saletotal" id="saletotal" value="0">
                    </div>
                </div>
            </form>
        `;
        
        const modal = createModal(title, content, true);
        
        // Initialize form functionality
        initializeSaleForm(modal);
        
        const form = modal.querySelector('#modalForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitSaleForm(modal);
        });
        
    }).catch(error => {
        showToast('Error loading sale data', 'error');
    });
}

function initializeSaleForm(modal) {
    // Set employee and customer names
    window.updateEmployeeName = function(select) {
        const selectedOption = select.options[select.selectedIndex];
        document.getElementById('empname').value = selectedOption.text.split(' (')[0];
    };
    
    window.updateCustomerName = function(select) {
        const selectedOption = select.options[select.selectedIndex];
        document.getElementById('cusname').value = selectedOption.text;
    };
    
    window.updateProductDetails = function(select) {
        const selectedOption = select.options[select.selectedIndex];
        const price = selectedOption.dataset.price || 0;
        const quantityInput = select.closest('.sale-item').querySelector('.quantity-input');
        const priceInput = select.closest('.sale-item').querySelector('.price-input');
        const itemName = selectedOption.dataset.name || '';
        
        priceInput.value = price;
        calculateItemTotal(priceInput);
    };
    
    window.calculateItemTotal = function(input) {
        const item = input.closest('.sale-item');
        const quantity = parseFloat(item.querySelector('.quantity-input').value) || 0;
        const price = parseFloat(item.querySelector('.price-input').value) || 0;
        const total = quantity * price;
        
        item.querySelector('.item-total').value = `$${total.toFixed(2)}`;
        item.querySelector('.amount-input').value = total.toFixed(2);
        
        calculateSaleTotal();
    };
    
    window.addSaleItem = function() {
        const container = document.getElementById('sale-items-container');
        const firstItem = container.querySelector('.sale-item');
        const newItem = firstItem.cloneNode(true);
        
        // Clear values
        newItem.querySelector('.product-select').selectedIndex = 0;
        newItem.querySelector('.quantity-input').value = 1;
        newItem.querySelector('.price-input').value = '';
        newItem.querySelector('.item-total').value = '$0.00';
        newItem.querySelector('.amount-input').value = '0';
        
        // Add remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'text-red-600 hover:text-red-800 ml-2';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = function() {
            newItem.remove();
            calculateSaleTotal();
        };
        
        newItem.querySelector('.price-input').parentNode.appendChild(removeBtn);
        container.appendChild(newItem);
    };
    
    window.calculateSaleTotal = function() {
        const items = document.querySelectorAll('.amount-input');
        let total = 0;
        
        items.forEach(item => {
            total += parseFloat(item.value) || 0;
        });
        
        document.getElementById('sale-total').textContent = `$${total.toFixed(2)}`;
        document.getElementById('saletotal').value = total.toFixed(2);
    };
    
    // Initialize calculation
    setTimeout(() => {
        calculateSaleTotal();
    }, 100);
}

async function submitSaleForm(modal) {
    const form = modal.querySelector('#modalForm');
    const formData = new FormData(form);
    
    // Extract sale data
    const saleData = {
        saledate: formData.get('saledate'),
        empid: formData.get('empid'),
        empname: formData.get('empname'),
        cusid: formData.get('cusid'),
        cusname: formData.get('cusname'),
        saletotal: parseFloat(formData.get('saletotal'))
    };
    
    // Extract sale items
    const products = formData.getAll('products[]');
    const quantities = formData.getAll('quantities[]');
    const prices = formData.getAll('prices[]');
    const amounts = formData.getAll('amounts[]');
    
    const details = products.map((productId, index) => {
        const productSelect = form.querySelectorAll('.product-select')[index];
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        
        return {
            proid: productId,
            proname: selectedOption.dataset.name || 'Unknown Product',
            saleqty: parseInt(quantities[index]),
            saleprice: parseFloat(prices[index]),
            saleamount: parseFloat(amounts[index])
        };
    }).filter(item => item.proid); // Remove empty items
    
    try {
        const submitBtn = modal.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-spinner loading-spinner mr-2"></i>Processing...';
        submitBtn.disabled = true;
        
        const result = await window.api.addSale(saleData, details);
        
        if (result.success) {
            showToast('Sale created successfully!', 'success');
            closeModal();
            loadSales();
        } else {
            throw new Error(result.error || 'Failed to create sale');
        }
        
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
        const submitBtn = modal.querySelector('button[type="submit"]');
        submitBtn.innerHTML = 'Save Changes';
        submitBtn.disabled = false;
    }
}

function viewSaleDetails(saleId) {
    window.api.getSaleDetails(saleId).then(details => {
        const title = `Sale Details #${saleId}`;
        let content = '<div class="space-y-4">';
        
        if (details.length === 0) {
            content += '<p class="text-gray-600">No details found</p>';
        } else {
            content += `
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="p-2 text-left">Product ID</th>
                                <th class="p-2 text-left">Product Name</th>
                                <th class="p-2 text-left">Quantity</th>
                                <th class="p-2 text-left">Price</th>
                                <th class="p-2 text-left">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            let total = 0;
            details.forEach(detail => {
                total += parseFloat(detail.saleamount);
                content += `
                    <tr class="border-t">
                        <td class="p-2">${detail.proid}</td>
                        <td class="p-2">${detail.proname}</td>
                        <td class="p-2">${detail.saleqty}</td>
                        <td class="p-2">$${parseFloat(detail.saleprice).toFixed(2)}</td>
                        <td class="p-2">$${parseFloat(detail.saleamount).toFixed(2)}</td>
                    </tr>
                `;
            });
            
            content += `
                        </tbody>
                    </table>
                </div>
                <div class="border-t pt-4 text-right">
                    <span class="text-lg font-bold">Total: $${total.toFixed(2)}</span>
                </div>
            `;
        }
        
        content += '</div>';
        
        createModal(title, content, false);
    }).catch(error => {
        showToast('Error loading sale details', 'error');
    });
}

async function deleteSale(saleId) {
    if (confirm('Are you sure you want to delete this sale?')) {
        showToast('Delete functionality coming soon!', 'info');
    }
}

// Imports - Complete Implementation
async function loadImports() {
    try {
        const imports = await window.api.getAllImports();
        const table = document.getElementById('imports-table');
        
        if (!imports || imports.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="6" class="table-cell text-center py-12">
                        <div class="empty-state">
                            <i class="fas fa-truck empty-state-icon"></i>
                            <p class="text-gray-600">No imports found</p>
                            <button onclick="showImportModal()" class="btn btn-primary mt-4">
                                <i class="fas fa-plus mr-2"></i>Create First Import
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        table.innerHTML = '';
        
        imports.forEach(imp => {
            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td class="table-cell font-medium">${imp.impid}</td>
                <td class="table-cell">${new Date(imp.impdate).toLocaleString()}</td>
                <td class="table-cell">${imp.supname || imp.supplier_name}</td>
                <td class="table-cell">${imp.empname || imp.employee_name}</td>
                <td class="table-cell font-medium text-blue-600">$${parseFloat(imp.imptotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td class="table-cell">
                    <div class="flex items-center space-x-2">
                        <button onclick="viewImportDetails(${imp.impid})" 
                                class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="deleteImport(${imp.impid})" 
                                class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            table.appendChild(row);
        });
        
    } catch (error) {
        showToast('Error loading imports', 'error');
    }
}

function showImportModal() {
    const title = 'Create New Import';
    
    // Get data for dropdowns
    Promise.all([
        window.api.getAllEmployees(),
        window.api.getAllSuppliers(),
        window.api.getAllProducts()
    ]).then(([employees, suppliers]) => {
        
        const employeeOptions = employees.map(emp => 
            `<option value="${emp.empid}">${emp.empname} (${emp.empid})</option>`
        ).join('');
        
        const supplierOptions = suppliers.map(sup => 
            `<option value="${sup.supid}" data-name="${sup.supname}">${sup.supname}</option>`
        ).join('');
        
        const content = `
            <form id="modalForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="form-label">Import Date *</label>
                        <input type="datetime-local" name="impdate" required 
                               class="form-input"
                               value="${new Date().toISOString().slice(0, 16)}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Supplier *</label>
                        <select name="supid" required class="form-select" onchange="updateSupplierName(this)">
                            <option value="">Select Supplier</option>
                            ${supplierOptions}
                        </select>
                        <input type="hidden" name="supname" id="supname">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Employee *</label>
                        <select name="empid" required class="form-select" onchange="updateImportEmployeeName(this)">
                            <option value="">Select Employee</option>
                            ${employeeOptions}
                        </select>
                        <input type="hidden" name="empname" id="import-empname">
                    </div>
                </div>
                
                <div class="border-t pt-4">
                    <h4 class="font-medium text-gray-700 mb-3">Import Items</h4>
                    <div id="import-items-container">
                        <div class="import-item grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <label class="form-label">Product ID *</label>
                                <input type="text" name="productIds[]" required 
                                       class="form-input"
                                       placeholder="PROD001">
                            </div>
                            <div>
                                <label class="form-label">Product Name *</label>
                                <input type="text" name="productNames[]" required 
                                       class="form-input"
                                       placeholder="Product Name">
                            </div>
                            <div>
                                <label class="form-label">Quantity *</label>
                                <input type="number" name="quantities[]" required 
                                       class="form-input quantity-input" min="1" value="1" 
                                       onchange="calculateImportItemTotal(this)">
                            </div>
                            <div>
                                <label class="form-label">Unit Price *</label>
                                <input type="number" name="prices[]" required 
                                       class="form-input price-input" step="0.01" 
                                       onchange="calculateImportItemTotal(this)"
                                       placeholder="19.99">
                            </div>
                            <div>
                                <label class="form-label">Total</label>
                                <input type="text" class="form-input import-item-total" readonly value="$0.00">
                                <input type="hidden" name="amounts[]" class="import-amount-input" value="0">
                            </div>
                        </div>
                    </div>
                    
                    <button type="button" onclick="addImportItem()" class="btn btn-secondary mb-4">
                        <i class="fas fa-plus mr-2"></i>Add Item
                    </button>
                </div>
                
                <div class="border-t pt-4">
                    <div class="flex justify-between items-center">
                        <span class="text-lg font-medium">Total Amount:</span>
                        <span id="import-total" class="text-2xl font-bold text-blue-600">$0.00</span>
                        <input type="hidden" name="imptotal" id="imptotal" value="0">
                    </div>
                </div>
            </form>
        `;
        
        const modal = createModal(title, content, true);
        
        // Initialize import form functionality
        initializeImportForm(modal);
        
        const form = modal.querySelector('#modalForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitImportForm(modal);
        });
        
    }).catch(error => {
        showToast('Error loading import data', 'error');
    });
}

function initializeImportForm(modal) {
    window.updateSupplierName = function(select) {
        const selectedOption = select.options[select.selectedIndex];
        document.getElementById('supname').value = selectedOption.dataset.name || selectedOption.text;
    };
    
    window.updateImportEmployeeName = function(select) {
        const selectedOption = select.options[select.selectedIndex];
        document.getElementById('import-empname').value = selectedOption.text.split(' (')[0];
    };
    
    window.calculateImportItemTotal = function(input) {
        const item = input.closest('.import-item');
        const quantity = parseFloat(item.querySelector('.quantity-input').value) || 0;
        const price = parseFloat(item.querySelector('.price-input').value) || 0;
        const total = quantity * price;
        
        item.querySelector('.import-item-total').value = `$${total.toFixed(2)}`;
        item.querySelector('.import-amount-input').value = total.toFixed(2);
        
        calculateImportTotal();
    };
    
    window.addImportItem = function() {
        const container = document.getElementById('import-items-container');
        const firstItem = container.querySelector('.import-item');
        const newItem = firstItem.cloneNode(true);
        
        // Clear values
        newItem.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
            if (!input.classList.contains('import-item-total') && !input.classList.contains('import-amount-input')) {
                input.value = '';
            }
        });
        newItem.querySelector('.import-item-total').value = '$0.00';
        newItem.querySelector('.import-amount-input').value = '0';
        
        // Add remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'text-red-600 hover:text-red-800 ml-2';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = function() {
            newItem.remove();
            calculateImportTotal();
        };
        
        newItem.querySelector('.price-input').parentNode.appendChild(removeBtn);
        container.appendChild(newItem);
    };
    
    window.calculateImportTotal = function() {
        const items = document.querySelectorAll('.import-amount-input');
        let total = 0;
        
        items.forEach(item => {
            total += parseFloat(item.value) || 0;
        });
        
        document.getElementById('import-total').textContent = `$${total.toFixed(2)}`;
        document.getElementById('imptotal').value = total.toFixed(2);
    };
    
    // Initialize calculation
    setTimeout(() => {
        calculateImportTotal();
    }, 100);
}

async function submitImportForm(modal) {
    const form = modal.querySelector('#modalForm');
    const formData = new FormData(form);
    
    // Extract import data
    const importData = {
        impdate: formData.get('impdate'),
        supid: formData.get('supid'),
        supname: formData.get('supname'),
        empid: formData.get('empid'),
        empname: formData.get('empname'),
        imptotal: parseFloat(formData.get('imptotal'))
    };
    
    // Extract import items
    const productIds = formData.getAll('productIds[]');
    const productNames = formData.getAll('productNames[]');
    const quantities = formData.getAll('quantities[]');
    const prices = formData.getAll('prices[]');
    const amounts = formData.getAll('amounts[]');
    
    const details = productIds.map((productId, index) => {
        return {
            proid: productId,
            proname: productNames[index],
            impqty: parseInt(quantities[index]),
            impprice: parseFloat(prices[index]),
            amount: parseFloat(amounts[index])
        };
    }).filter(item => item.proid); // Remove empty items
    
    try {
        const submitBtn = modal.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-spinner loading-spinner mr-2"></i>Processing...';
        submitBtn.disabled = true;
        
        const result = await window.api.addImport(importData, details);
        
        if (result.success) {
            showToast('Import created successfully!', 'success');
            closeModal();
            loadImports();
        } else {
            throw new Error(result.error || 'Failed to create import');
        }
        
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
        const submitBtn = modal.querySelector('button[type="submit"]');
        submitBtn.innerHTML = 'Save Changes';
        submitBtn.disabled = false;
    }
}

function viewImportDetails(importId) {
    window.api.getImportDetails(importId).then(details => {
        const title = `Import Details #${importId}`;
        let content = '<div class="space-y-4">';
        
        if (details.length === 0) {
            content += '<p class="text-gray-600">No details found</p>';
        } else {
            content += `
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="p-2 text-left">Product ID</th>
                                <th class="p-2 text-left">Product Name</th>
                                <th class="p-2 text-left">Quantity</th>
                                <th class="p-2 text-left">Price</th>
                                <th class="p-2 text-left">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            let total = 0;
            details.forEach(detail => {
                total += parseFloat(detail.amount);
                content += `
                    <tr class="border-t">
                        <td class="p-2">${detail.proid}</td>
                        <td class="p-2">${detail.proname}</td>
                        <td class="p-2">${detail.impqty}</td>
                        <td class="p-2">$${parseFloat(detail.impprice).toFixed(2)}</td>
                        <td class="p-2">$${parseFloat(detail.amount).toFixed(2)}</td>
                    </tr>
                `;
            });
            
            content += `
                        </tbody>
                    </table>
                </div>
                <div class="border-t pt-4 text-right">
                    <span class="text-lg font-bold">Total: $${total.toFixed(2)}</span>
                </div>
            `;
        }
        
        content += '</div>';
        
        createModal(title, content, false);
    }).catch(error => {
        showToast('Error loading import details', 'error');
    });
}

async function deleteImport(importId) {
    if (confirm('Are you sure you want to delete this import?')) {
        showToast('Delete functionality coming soon!', 'info');
    }
}

// Dashboard functions
async function loadDashboard() {
    try {
        const [employees, customers, products] = await Promise.all([
            window.api.getAllEmployees(),
            window.api.getAllCustomers(),
            window.api.getAllProducts()
        ]);
        
        document.getElementById('total-employees').textContent = employees.length;
        document.getElementById('total-customers').textContent = customers.length;
        document.getElementById('total-products').textContent = products.length;
        
        // Calculate today's sales
        try {
            const sales = await window.api.getAllSales();
            const today = new Date().toDateString();
            const todaySales = sales.filter(sale => 
                new Date(sale.saledate).toDateString() === today
            );
            const todayTotal = todaySales.reduce((sum, sale) => sum + parseFloat(sale.saletotal), 0);
            document.getElementById('today-sales').textContent = `$${todayTotal.toFixed(2)}`;
        } catch (e) {
            document.getElementById('today-sales').textContent = '$0.00';
        }
        
        // Update recent activity
        const activityElement = document.getElementById('recent-activity');
        const activities = [
            `System loaded with ${employees.length} employees`,
            `${customers.length} customers in database`,
            `${products.length} products in inventory`
        ];
        
        activityElement.innerHTML = activities.map(activity => `
            <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                <i class="fas fa-info-circle text-blue-500 mr-3"></i>
                <span class="text-gray-700">${activity}</span>
            </div>
        `).join('');
        
    } catch (error) {
        showToast('Error loading dashboard data', 'error');
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});

function createImageUploadComponent(options = {}) {
    const {
        existingImage = '',
        label = 'Profile Photo',
        containerId = `imageUpload_${Date.now()}`
    } = options;
    
    const html = `
        <div id="${containerId}" class="image-upload-component">
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 class="text-lg font-semibold text-gray-800 mb-4 text-center">${label}</h3>
                <div class="image-upload-container">
                    <div class="relative">
                        <div id="imagePreview_${containerId}" class="image-preview image-preview-circle w-40 h-40 mx-auto ${existingImage ? 'has-image' : ''}">
                            ${existingImage ? 
                                `<img src="data:image/jpeg;base64,${existingImage}" alt="Preview" class="preview-image">` : 
                                `<div class="placeholder">
                                    <i class="fas fa-user text-4xl text-gray-400"></i>
                                    <span class="mt-3 text-sm text-gray-500">Upload profile photo</span>
                                 </div>`
                            }
                        </div>
                        <div class="mt-4 flex flex-col gap-3">
                            <label for="photoInput_${containerId}" class="upload-btn cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                                <i class="fas fa-cloud-upload-alt mr-2"></i>
                                ${existingImage ? 'Change Photo' : 'Upload Photo'}
                            </label>
                            <input type="file" 
                                   id="photoInput_${containerId}" 
                                   accept="image/*" 
                                   class="hidden">
                            <div class="flex items-center justify-center gap-2 text-xs text-gray-500">
                                <i class="fas fa-info-circle text-blue-500"></i>
                                <span>JPG, PNG • Max 5MB</span>
                            </div>
                        </div>
                    </div>
                    <input type="hidden" id="photoBase64_${containerId}" value="${existingImage}">
                </div>
            </div>
        </div>
    `;
    
    return {
        html,
        containerId,
        getImage: () => {
            const element = document.getElementById(`photoBase64_${containerId}`);
            return element ? element.value : '';
        },
        setup: (onImageChange) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            const imagePreview = container.querySelector(`#imagePreview_${containerId}`);
            const photoInput = container.querySelector(`#photoInput_${containerId}`);
            const photoBase64 = container.querySelector(`#photoBase64_${containerId}`);
            const uploadBtn = container.querySelector('.upload-btn');
            
            // Handle file input change
            photoInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                // Validate file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    showToast('File size must be less than 5MB', 'error');
                    return;
                }
                
                // Validate file type
                const validTypes = ['image/jpeg', 'image/png'];
                if (!validTypes.includes(file.type)) {
                    showToast('Please upload a valid image (JPG, PNG)', 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    // Get base64 string
                    const base64String = event.target.result.split(',')[1];
                    photoBase64.value = base64String;
                    
                    // Update preview
                    imagePreview.innerHTML = `
                        <img src="${event.target.result}" alt="Preview" class="preview-image">
                    `;
                    imagePreview.classList.add('has-image');
                    uploadBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Change Photo';
                    
                    // Add remove button event
                    const removeBtn = container.querySelector(`#removeImageBtn_${containerId}`);
                    removeBtn.addEventListener('click', function() {
                        photoBase64.value = '';
                        imagePreview.innerHTML = `
                            <div class="placeholder">
                                <i class="fas fa-user text-4xl text-gray-400"></i>
                                <span class="mt-3 text-sm text-gray-500">Upload profile photo</span>
                             </div>
                        `;
                        imagePreview.classList.remove('has-image');
                        uploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt mr-2"></i>Upload Photo';
                        photoInput.value = '';
                        if (onImageChange) onImageChange('');
                    });
                    
                    // Call change callback
                    if (onImageChange) onImageChange(base64String);
                };
                
                reader.readAsDataURL(file);
            });
        }
    };
}

// Add the styles once
function addImageUploadStyles() {
    if (document.querySelector('#image-upload-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'image-upload-styles';
    styles.textContent = `
        .image-upload-component {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .image-upload-container {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .image-preview {
            width: 160px;
            height: 160px;
            border: 3px dashed #d1d5db;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            position: relative;
            transition: all 0.3s ease;
            margin: 0 auto;
        }
        
        .image-preview:hover {
            border-color: #9ca3af;
            transform: scale(1.02);
        }
        
        .image-preview.has-image {
            border-style: solid;
            border-color: #3b82f6;
            box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.04);
        }
        
        .image-preview .placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            text-align: center;
            padding: 1rem;
        }
        
        .preview-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
        }
        
        .upload-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 1.5rem;
            background-color: #3b82f6;
            color: white;
            border-radius: 0.75rem;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.875rem;
            font-weight: 600;
            border: none;
            width: 100%;
            margin-top: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
        }
        
        .upload-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
        }
        
        .upload-btn:active {
            transform: translateY(0);
        }
    `;
    document.head.appendChild(styles);
}