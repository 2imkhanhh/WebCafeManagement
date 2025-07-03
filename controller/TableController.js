export function initTablePage(mainContent) {
  loadTables(mainContent);
  handleAddTable(mainContent);
}

function loadTables(mainContent) {
  const tableGrid = mainContent.querySelector('#tableGrid');

  fetch('../api/get_tables.php')
    .then(res => res.json())
    .then(data => {
      tableGrid.innerHTML = '';
      if (data.success && Array.isArray(data.data)) {
        data.data.forEach(table => {
          const tableItem = document.createElement('div');
          tableItem.className = `table-item ${table.Status}`;
          tableItem.innerHTML = `
            <h3>${table.Name}</h3>
            <p>Order ID: ${table.orderID || 'Chưa có'}</p> <!-- Hiển thị orderID -->
            <div class="action-buttons">
              <button class="btn-edit" data-id="${table.tableID}">Sửa</button>
              <button class="btn-delete">Xoá</button>
            </div>
          `;
          tableGrid.appendChild(tableItem);

          const editBtn = tableItem.querySelector('.btn-edit');
          editBtn.addEventListener('click', () => openEditPopup(mainContent, table));

          const deleteBtn = tableItem.querySelector('.btn-delete');
          deleteBtn.addEventListener('click', () => handleDeleteTable(table.tableID, mainContent));
        });
      } else {
        console.error('Dữ liệu trả về không hợp lệ:', data);
        tableGrid.innerHTML = '<p>Không thể tải danh sách bàn. Vui lòng kiểm tra lại.</p>';
      }
    })
    .catch(err => {
      console.error('Lỗi khi tải danh sách bàn:', err);
      tableGrid.innerHTML = '<p>Lỗi kết nối hoặc server. Vui lòng thử lại sau.</p>';
    });
}

export function handleAddTable(mainContent) {
  const form = mainContent.querySelector('#tableForm');
  const addForm = mainContent.querySelector('#add-table-form');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new URLSearchParams(new FormData(form));
    const orderID = form.querySelector('#tableOrderID')?.value || ''; // Lấy orderID nếu có

    if (orderID) formData.append('orderID', orderID);

    fetch('../api/add_table.php', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Đã thêm bàn!');
        addForm.close();
        form.reset();
        loadTables(mainContent);
      } else {
        alert(`Lỗi khi thêm bàn: ${data.message || 'Không xác định'}`);
      }
    })
    .catch(err => {
      console.error('Lỗi khi thêm bàn:', err);
      alert('Lỗi kết nối hoặc server: ' + err.message);
    });
  });

  const btnShowTableForm = mainContent.querySelector('#btnShowTableForm');
  const btnCancelTable = mainContent.querySelector('#btnCancelTable');

  if (btnShowTableForm && addForm && btnCancelTable) {
    btnShowTableForm.addEventListener('click', () => {
      addForm.showModal();
      form.reset();
    });

    btnCancelTable.addEventListener('click', () => {
      addForm.close();
    });
  } else {
    console.error('Một hoặc nhiều phần tử không được tìm thấy:', { btnShowTableForm, addForm, btnCancelTable });
  }
}

function openEditPopup(mainContent, table) {
  const editForm = mainContent.querySelector('#edit-table-form');
  const form = mainContent.querySelector('#editTableForm');

  form.querySelector('#editTableID').value = table.tableID;
  form.querySelector('#editTableName').value = table.Name;
  form.querySelector('#editTableStatus').value = table.Status;
  form.querySelector('#editTableOrderID').value = table.orderID || ''; // Hiển thị orderID

  editForm.showModal();

  const cancelBtn = mainContent.querySelector('#btnCancelEditTable');
  cancelBtn.onclick = () => editForm.close();

  form.onsubmit = function (e) {
    e.preventDefault();
    const formData = new URLSearchParams(new FormData(form));
    const orderID = form.querySelector('#editTableOrderID').value || null;

    if (orderID) formData.append('orderID', orderID);

    fetch('../api/update_table.php', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Đã cập nhật bàn!');
        editForm.close();
        loadTables(mainContent);
      } else {
        alert('Cập nhật thất bại: ' + (data.message || 'Không xác định'));
      }
    })
    .catch(err => {
      console.error('Lỗi khi cập nhật bàn:', err);
      alert('Lỗi kết nối hoặc server: ' + err.message);
    });
  };
}

function handleDeleteTable(tableId, mainContent) {
  if (confirm('Bạn có chắc chắn muốn xóa bàn này?')) {
    fetch('../api/delete_table.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ tableID: tableId })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Đã xóa bàn!');
        loadTables(mainContent);
      } else {
        alert('Xóa thất bại: ' + (data.message || 'Không xác định'));
      }
    })
    .catch(err => {
      console.error('Lỗi khi xóa bàn:', err);
      alert('Lỗi kết nối hoặc server: ' + err.message);
    });
  }
}