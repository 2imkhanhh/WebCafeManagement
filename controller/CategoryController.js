async function initCategoryPage() {
  const apiUrl = '../api/category.php';

  // Tải danh mục
  async function loadCategories() {
    try {
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (data.success) {
        const tbody = document.getElementById('categoryBody');
        tbody.innerHTML = data.data.map(cat => `
          <tr>
            <td>${cat.categoryID}</td>
            <td>${cat.Name}</td>
            <td>
              <button class="btn-edit" data-id="${cat.categoryID}">Sửa</button>
              <button class="btn-delete" data-id="${cat.categoryID}">Xóa</button>
            </td>
          </tr>
        `).join('');

        // Gán sự kiện cho nút Sửa
        document.querySelectorAll('.btn-edit').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const res = await fetch(`${apiUrl}?id=${id}`);
            const result = await res.json();
            if (result.success) {
              document.getElementById('categoryForm').style.display = 'flex';
              document.getElementById('formTitle').textContent = 'Sửa danh mục';
              document.getElementById('categoryId').value = result.data.categoryID;
              document.getElementById('categoryName').value = result.data.Name;
            } else {
              alert(result.error);
            }
          });
        });

        // Gán sự kiện cho nút Xóa
        document.querySelectorAll('.btn-delete').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (confirm('Bạn có chắc muốn xóa danh mục này?')) {
              const id = btn.getAttribute('data-id');
              const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id })
              });
              const result = await response.json();
              if (result.success) {
                loadCategories();
              } else {
                alert(result.error || 'Xóa thất bại');
              }
            }
          });
        });
      } else {
        alert(data.error || 'Không tải được danh mục');
      }
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
    }
  }

  // Xử lý submit form
  document.getElementById('categoryFormInput').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('categoryId').value.trim();
    const name = document.getElementById('categoryName').value.trim();

    if (!name) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    const action = id ? 'update' : 'add';
    const body = { action, id, name };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await response.json();

      if (result.success) {
        loadCategories();
        document.getElementById('categoryForm').style.display = 'none';
        e.target.reset();
      } else {
        alert(result.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      console.error('Lỗi:', err);
    }
  });

  // Nút hủy
  document.getElementById('btnCancel').addEventListener('click', () => {
    document.getElementById('categoryForm').style.display = 'none';
  });

  // Nút thêm
  document.getElementById('btnAddCategory').addEventListener('click', () => {
    document.getElementById('categoryForm').style.display = 'flex';
    document.getElementById('formTitle').textContent = 'Thêm danh mục';
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryName').value = '';
  });

  // Gọi lần đầu
  loadCategories();
}
