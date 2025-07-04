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
            <p>Order ID: ${table.orderID || 'Chưa có'}</p>
            <div class="action-buttons">
              <button class="btn-edit" data-id="${table.tableID}">Sửa</button>
              <button class="btn-delete">Xoá</button>
              <button class="btn-view-order" data-id="${table.tableID}" data-order-id="${table.orderID || ''}">Xem Đơn</button>
            </div>
          `;
          tableGrid.appendChild(tableItem);

          const editBtn = tableItem.querySelector('.btn-edit');
          editBtn.addEventListener('click', () => openEditPopup(mainContent, table));

          const deleteBtn = tableItem.querySelector('.btn-delete');
          deleteBtn.addEventListener('click', () => handleDeleteTable(table.tableID, mainContent));

          const viewOrderBtn = tableItem.querySelector('.btn-view-order');
          viewOrderBtn.addEventListener('click', () => {
            const orderId = table.orderID ? parseInt(table.orderID) : null;
            console.log('View Order clicked for table', table.tableID, 'with orderId', orderId); // Debug
            showOrderDetails(mainContent, table.tableID, orderId);
          });
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
    const tableName = form.querySelector('#tableName').value;

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
  form.querySelector('#editTableOrderID').value = table.orderID || '';

  editForm.showModal();

  const cancelBtn = mainContent.querySelector('#btnCancelEditTable');
  cancelBtn.onclick = () => editForm.close();

  form.onsubmit = function (e) {
    e.preventDefault();
    const formData = new URLSearchParams(new FormData(form));
    // const orderID = form.querySelector('#editTableOrderID').value || null;

    // if (orderID) formData.append('orderID', orderID);

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

function showOrderDetails(mainContent, tableId, orderId) {
  const dialog = document.createElement('dialog');
  dialog.id = 'order-details-dialog';
  dialog.innerHTML = `
    <h3>Chi tiết đơn hàng cho bàn ${tableId}</h3>
    <div id="order-details-content">
      <p>Đang tải...</p>
    </div>
    <button id="btnCloseOrderDetails" class="btn-delete">Đóng</button>
  `;
  mainContent.appendChild(dialog);

  console.log('Fetching order details for orderId:', orderId);

  if (orderId && orderId > 0) {
    Promise.all([
      fetch('../api/get_order_by_id.php?orderID=' + orderId).then(res => res.json()),
      fetch('../api/get_order_details.php?orderID=' + orderId).then(res => res.json())
    ])
    .then(([orderResponse, detailsResponse]) => {
      console.log('Order response:', orderResponse);
      console.log('Details response:', detailsResponse);

      const content = document.getElementById('order-details-content');

      if (orderResponse.success && orderResponse.data && detailsResponse.success && Array.isArray(detailsResponse.data)) {
        const order = orderResponse.data;
        const details = detailsResponse.data;

        let itemsHtml = '<ul>';
        details.forEach(item => {
          itemsHtml += `
            <li>
              Món: ${item.Name || 'Không xác định'}, Số lượng: ${item.quantity}, Giá: ${parseInt(item.price).toLocaleString()}đ
            </li>
          `;
        });
        itemsHtml += '</ul>';

        content.innerHTML = `
          <p>Order ID: ${order.orderID}</p>
          <p>Ngày: ${order.orderDate}</p>
          <p>Danh sách món:</p>
          ${itemsHtml}
          <p>Tổng tiền: ${parseInt(order.totalPrice).toLocaleString()}đ</p>
        `;

        // ✅ Nút thanh toán bên trong phạm vi order
        const payBtn = document.createElement('button');
        payBtn.textContent = 'Thanh toán';
        payBtn.className = 'btn-save';
        payBtn.addEventListener('click', () => {
          if (confirm('Xác nhận thanh toán?')) {
            fetch('../api/create_invoice.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                orderID: order.orderID,
                total: order.totalPrice,
                tableID: tableId
              })
            })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                alert('Đã tạo hóa đơn!');
                dialog.close();
                mainContent.removeChild(dialog);
                loadTables(mainContent);
              } else {
                alert('Lỗi: ' + data.message);
              }
            })
            .catch(err => {
              console.error('Lỗi khi tạo hóa đơn:', err);
              alert('Lỗi khi tạo hóa đơn: ' + err.message);
            });
          }
        });

        dialog.appendChild(payBtn);

      } else {
        content.innerHTML = '<p>Không có đơn hàng hoặc dữ liệu không hợp lệ.</p>';
      }
    })
    .catch(err => {
      console.error('Lỗi khi tải chi tiết đơn hàng:', err);
      document.getElementById('order-details-content').innerHTML = '<p>Lỗi khi tải chi tiết đơn hàng: ' + err.message + '</p>';
    });
  } else {
    document.getElementById('order-details-content').innerHTML = '<p>Chưa có đơn hàng hợp lệ cho bàn này (orderId: ' + orderId + ').</p>';
  }

  dialog.showModal();

  const closeBtn = dialog.querySelector('#btnCloseOrderDetails');
  closeBtn.addEventListener('click', () => {
    dialog.close();
    mainContent.removeChild(dialog);
  });
}