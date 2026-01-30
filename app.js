// Biến lưu trữ dữ liệu
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentSort = { field: null, order: 'asc' };

// Fetch all products
async function getAllProducts() {
    try {
        const response = await fetch('https://api.escuelajs.co/api/v1/products');
        if (!response.ok) throw new Error('Không thể tải dữ liệu');
        
        allProducts = await response.json();
        filteredProducts = [...allProducts];
        displayProducts();
    } catch (error) {
        document.getElementById('table-container').innerHTML = 
            `<div class="error">Lỗi: ${error.message}</div>`;
    }
}

function renderTable(products) {
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Không tìm thấy sản phẩm nào</td></tr>';
        return;
    }

    products.forEach(product => {
        const tr = document.createElement('tr');
        
        // Placeholder mặc định
        let imageUrl = 'https://placehold.co/80x80?text=No+Image';
        
        // Danh sách domain BỊ CHẶN hoặc LỖI
        const blockedDomains = [
            'placeimg.com',
            'susercontent.com',
            'api.escuelajs.co/api/v1/files',  // ✅ API này bị CORS
            'via.placeholder.com'  // ✅ Domain này đã chết
        ];
        
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            for (let img of product.images) {
                let cleanUrl = img;
                
                if (typeof cleanUrl === 'string') {
                    // Xóa các ký tự đặc biệt
                    cleanUrl = cleanUrl.replace(/[\[\]"']/g, '').trim();
                    
                    // Tách nếu có dấu phẩy
                    if (cleanUrl.includes(',')) {
                        cleanUrl = cleanUrl.split(',')[0].trim();
                    }
                    
                    // Kiểm tra URL hợp lệ
                    if (cleanUrl && (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://'))) {
                        
                        // Kiểm tra domain có bị chặn không
                        const isDomainBlocked = blockedDomains.some(domain => 
                            cleanUrl.includes(domain)
                        );
                        
                        if (!isDomainBlocked) {
                            imageUrl = cleanUrl;
                            break;
                        }
                    }
                }
            }
        }
        
        tr.innerHTML = `
            <td>${product.id}</td>
            <td>
                <img src="${imageUrl}" 
                     alt="${product.title}" 
                     class="product-image"
                     onerror="this.onerror=null; this.src='https://placehold.co/80x80?text=Error';">
            </td>
            <td>${product.title}</td>
            <td class="price">$${product.price}</td>
            <td><span class="category">${product.category?.name || 'N/A'}</span></td>
            <td>${product.description}</td>
        `;
        tbody.appendChild(tr);
    });
}

function displayProducts() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToDisplay = filteredProducts.slice(startIndex, endIndex);

    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Hình ảnh</th>
                    <th>Tên sản phẩm</th>
                    <th>Giá</th>
                    <th>Danh mục</th>
                    <th>Mô tả</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;

    document.getElementById('table-container').innerHTML = tableHTML;
    renderTable(productsToDisplay);
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const totalItems = filteredProducts.length;
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    document.getElementById('info').textContent = 
        `Hiển thị ${startItem}-${endItem} / ${totalItems} sản phẩm`;

    const pagination = document.getElementById('pagination');
    pagination.innerHTML = `
        <button onclick="goToPage(1)" ${currentPage === 1 ? 'disabled' : ''}>« Đầu</button>
        <button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹ Trước</button>
        <button class="active">${currentPage} / ${totalPages}</button>
        <button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Sau ›</button>
        <button onclick="goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>Cuối »</button>
    `;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    displayProducts();
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    filteredProducts = allProducts.filter(product => 
        product.title.toLowerCase().includes(searchTerm)
    );
    
    currentPage = 1;
    displayProducts();
});

// Items per page
document.getElementById('itemsPerPage').addEventListener('change', (e) => {
    itemsPerPage = parseInt(e.target.value);
    currentPage = 1;
    displayProducts();
});

// Sort functionality
document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const sortField = btn.dataset.sort;
        
        // Toggle sort order
        if (currentSort.field === sortField) {
            currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.field = sortField;
            currentSort.order = 'asc';
        }
        
        // Update button states
        document.querySelectorAll('.sort-btn').forEach(b => {
            b.classList.remove('active-asc', 'active-desc');
        });
        btn.classList.add(currentSort.order === 'asc' ? 'active-asc' : 'active-desc');
        
        // Sort products
        filteredProducts.sort((a, b) => {
            let valueA = sortField === 'price' ? a.price : a.title.toLowerCase();
            let valueB = sortField === 'price' ? b.price : b.title.toLowerCase();
            
            if (currentSort.order === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
        
        currentPage = 1;
        displayProducts();
    });
});

// Initialize
getAllProducts();
