let tablesMap = new Map();

function loadTablesMap() {
  return fetch('../api/get_tables.php')
    .then(res => {
      if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
      return res.json();
    })
    .then(data => {
      if (data.success && Array.isArray(data.data)) {
        tablesMap = new Map(data.data.map(table => [parseInt(table.tableID), table.Name]));
      } else {
        console.warn('Dữ liệu bàn không hợp lệ:', data);
      }
    })
    .catch(err => console.error('Lỗi khi tải danh sách bàn:', err));
}

export function loadOrders(mainContent) {
  const orderGrid = mainContent.querySelector('#orderGrid');

  loadTablesMap().then(() => {
    fetch('../api/get_orders.php')
      .then(res => {
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        console.log('Dữ liệu từ API (orders):', data);
        orderGrid.innerHTML = '';
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          data.data.forEach(item => {
            const order = document.createElement('div');
            order.className = 'order-item';
            const orderDate = item.orderDate;
            const statusText = item.status === 'completed' ? 'Mang về' : 'Dùng tại quán';
            const tableName = item.tableID ? tablesMap.get(parseInt(item.tableID)) || 'Không xác định' : 'Chưa có';
            order.innerHTML = `
              <h3>Đơn hàng #${item.orderID}</h3>
              <p>Ngày: ${orderDate}</p>
              <p>Tổng: ${parseInt(item.totalPrice).toLocaleString()}đ</p>
              <p>Trạng thái: ${statusText}</p>
              <p>Bàn: ${tableName}</p>
              <div class="action-buttons">
                <button class="btn-edit" data-id="${item.orderID}">Sửa</button>
                <button class="btn-delete" data-id="${item.orderID}">Xoá</button>
              </div>
            `;
            orderGrid.appendChild(order);

            const editBtn = order.querySelector('.btn-edit');
            editBtn.addEventListener('click', () => openEditPopup(mainContent, item));

            const deleteBtn = order.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', () => handleDeleteOrder(item.orderID, mainContent));
          });
        } else {
          orderGrid.innerHTML = '<p>Không có đơn hàng nào.</p>';
        }
      })
      .catch(err => console.error('Lỗi khi tải danh sách đơn hàng:', err));
  });
}

export function handleAddOrder(mainContent) {
  const form = mainContent.querySelector('#addOrderForm');
  const orderForm = mainContent.querySelector('#add-form');
  const btnShowOrderForm = mainContent.querySelector('#btnShowOrderForm');
  const btnCancelOrder = mainContent.querySelector('#btnCancel');

  console.log('mainContent in handleAddOrder:', mainContent);
  console.log('Elements found in handleAddOrder:', {
    form, orderForm, btnShowOrderForm, btnCancelOrder
  });

  if (form && orderForm && btnShowOrderForm && btnCancelOrder) {
    btnShowOrderForm.addEventListener('click', () => {
      orderForm.showModal();
      loadDrinksForOrder(orderForm);
      loadTablesForOrder(orderForm);
      form.reset();
    });

    function loadDrinksForOrder(orderFormElement) {
      fetch('../api/get_drinks.php')
        .then(res => {
          if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
          return res.json();
        })
        .then(data => {
          console.log('Dữ liệu món từ API:', data);
          const drinkSelect = orderFormElement.querySelector('#drinkSelect');
          if (drinkSelect) {
            drinkSelect.innerHTML = '<option value="">-- Chọn món --</option>';
            if (data.success && Array.isArray(data.data) && data.data.length > 0) {
              data.data.forEach(drink => {
                const option = document.createElement('option');
                option.value = drink.drinksID;
                option.textContent = drink.Name;
                option.dataset.price = drink.Price || 0;
                drinkSelect.appendChild(option);
              });
            } else {
              console.warn('Không có dữ liệu món hoặc API trả về lỗi:', data);
              drinkSelect.innerHTML += '<option value="" disabled>Không có món nào</option>';
            }
          }
        })
        .catch(err => console.error('Lỗi khi tải danh sách món:', err));
    }

    function loadTablesForOrder(orderFormElement) {
      fetch('../api/get_tables.php')
        .then(res => {
          if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
          return res.json();
        })
        .then(data => {
          console.log('Dữ liệu bàn từ API:', data);
          const tableSelect = orderFormElement.querySelector('#tableSelect');
          if (tableSelect) {
            tableSelect.innerHTML = '<option value="">-- Chọn bàn trống --</option>';
            if (data.success && Array.isArray(data.data)) {
              data.data
                .filter(table => table.Status === 'off')
                .forEach(table => {
                  const option = document.createElement('option');
                  option.value = table.tableID;
                  option.textContent = `Bàn ${table.Name} (ID: ${table.tableID})`;
                  tableSelect.appendChild(option);
                });
            } else {
              console.warn('Không có dữ liệu bàn hoặc API trả về lỗi:', data);
              tableSelect.innerHTML += '<option value="" disabled>Không có bàn trống</option>';
            }
          }
        })
        .catch(err => console.error('Lỗi khi tải danh sách bàn:', err));
    }

    const drinkSelect = form.querySelector('#drinkSelect');
    const priceInput = form.querySelector('#price');
    const quantityInput = form.querySelector('#quantity');
    const totalPriceInput = form.querySelector('#totalPrice');
    const tableSelect = form.querySelector('#tableSelect');

    drinkSelect.addEventListener('change', () => {
      const selectedOption = drinkSelect.options[drinkSelect.selectedIndex];
      const price = selectedOption.dataset.price;
      priceInput.value = price ? parseInt(price).toLocaleString() : '';
      calculateTotal();
    });

    quantityInput.addEventListener('input', calculateTotal);

    function calculateTotal() {
      const price = parseInt(drinkSelect.options[drinkSelect.selectedIndex]?.dataset.price) || 0;
      const quantity = parseInt(quantityInput.value) || 1;
      const total = price * quantity;
      totalPriceInput.value = total.toLocaleString();
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('Form submitted, formData:', new FormData(form));

      const formData = new FormData(form);
      const orderDate = formData.get('orderDate');
      formData.set('orderDate', orderDate);
      formData.set('totalPrice', parseInt(totalPriceInput.value.replace(/[^0-9]/g, '')));
      const drinksID = drinkSelect.value;
      if (!drinksID) {
        alert('Vui lòng chọn món!');
        return;
      }
      formData.set('drinksID', drinksID);

      const tableId = tableSelect.value;
      if (!tableId) {
        alert('Vui lòng chọn bàn!');
        return;
      }
      formData.set('tableID', tableId);

      const quantity = parseInt(quantityInput.value) || 1;
      formData.set('quantity', quantity);

      fetch('../api/add_order.php', {
        method: 'POST',
        body: formData
      })
        .then(res => {
          if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
          return res.json();
        })
        .then(data => {
          console.log('Response từ API:', data);
          if (data.success) {
            alert('Đã thêm đơn hàng!');
            orderForm.close();
            form.reset();
            loadOrders(mainContent);
            updateTableStatus(tableId, 'on', mainContent);
          } else {
            alert(`Lỗi khi thêm đơn hàng: ${data.message || 'Không xác định'}`);
          }
        })
        .catch(err => {
          console.error('Lỗi khi gửi yêu cầu:', err);
          alert('Lỗi kết nối hoặc server: ' + err.message);
        });
    });

    btnCancelOrder.addEventListener('click', () => {
      orderForm.close();
    });
  } else {
    console.error('Không tìm thấy form hoặc các phần tử liên quan trong mainContent:', {
      form, orderForm, btnShowOrderForm, btnCancelOrder
    });
  }
}

function openEditPopup(mainContent, order) {
  const orderForm = mainContent.querySelector('#edit-form');
  const form = mainContent.querySelector('#editOrderForm');
  const btnCancelOrder = mainContent.querySelector('#btnCancelEdit');

  console.log('mainContent in openEditPopup:', mainContent);
  console.log('Elements found in openEditPopup:', {
    orderForm, form, btnCancelOrder
  });

  if (orderForm && form && btnCancelOrder) {
    orderForm.showModal();

    // Hiển thị thông tin hiện tại
    form.querySelector('#orderID').value = order.orderID;
    form.querySelector('#orderDate').value = order.orderDate.split(' ')[0];
    form.querySelector('#totalPrice').value = parseInt(order.totalPrice).toLocaleString();
    form.querySelector('#status').value = order.status;
    form.querySelector('#quantity').value = order.quantity || 1;

    // Tải danh sách món
    fetch('../api/get_drinks.php')
      .then(res => {
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const drinkSelect = form.querySelector('#drinkSelect');
          drinkSelect.innerHTML = '<option value="">-- Chọn món --</option>';
          const currentDrink = data.data.find(drink => drink.drinksID == order.drinksID);
          data.data.forEach(drink => {
            const option = document.createElement('option');
            option.value = drink.drinksID;
            option.textContent = drink.Name;
            option.dataset.price = drink.Price || 0;
            if (drink.drinksID == order.drinksID) option.selected = true;
            drinkSelect.appendChild(option);
          });
          const priceInput = form.querySelector('#price');
          if (currentDrink) {
            priceInput.value = parseInt(currentDrink.Price).toLocaleString();
            calculateTotalEdit();
          } else {
            priceInput.value = '';
            form.querySelector('#totalPrice').value = '';
            console.warn('Không tìm thấy món hiện tại:', order.drinksID);
          }
        } else {
          console.warn('Không có dữ liệu món hoặc API trả về lỗi:', data);
          form.querySelector('#drinkSelect').innerHTML = '<option value="" disabled>Không có món nào</option>';
          form.querySelector('#price').value = '';
          form.querySelector('#totalPrice').value = '';
        }
      })
      .catch(err => {
        console.error('Lỗi khi tải danh sách món:', err);
        form.querySelector('#drinkSelect').innerHTML = '<option value="" disabled>Không có món nào</option>';
        form.querySelector('#price').value = '';
        form.querySelector('#totalPrice').value = '';
      });

    // Tải danh sách bàn trống, bao gồm cả bàn hiện tại của đơn hàng
    fetch('../api/get_tables.php')
      .then(res => {
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const tableSelect = form.querySelector('#tableSelect');
          tableSelect.innerHTML = '<option value="">-- Chọn bàn trống --</option>';
          const availableTables = data.data.filter(table => table.Status === 'off' || table.tableID == order.tableID);
          availableTables.forEach(table => {
            const option = document.createElement('option');
            option.value = table.tableID;
            option.textContent = `Bàn ${table.Name} (ID: ${table.tableID})`;
            if (table.tableID == order.tableID) option.selected = true;
            tableSelect.appendChild(option);
          });
          tableSelect.disabled = false;
          tableSelect.style.pointerEvents = 'auto';
          tableSelect.style.opacity = '1';
          tableSelect.style.cursor = 'pointer';
          tableSelect.style.backgroundColor = '#fff';
          tableSelect.style.userSelect = 'auto';
          console.log('tableSelect after setup:', tableSelect.outerHTML);
        } else {
          console.warn('Không có dữ liệu bàn hoặc API trả về lỗi:', data);
          const tableSelect = form.querySelector('#tableSelect');
          tableSelect.innerHTML = '<option value="" disabled>Không có bàn trống</option>';
        }
      })
      .catch(err => console.error('Lỗi khi tải danh sách bàn:', err));

    // Hàm tính tổng cho form sửa
    function calculateTotalEdit() {
      const drinkSelect = form.querySelector('#drinkSelect');
      const priceInput = form.querySelector('#price');
      const quantityInput = form.querySelector('#quantity');
      const totalPriceInput = form.querySelector('#totalPrice');
      const selectedOption = drinkSelect.options[drinkSelect.selectedIndex];
      if (selectedOption && selectedOption.dataset.price) {
        const price = parseInt(selectedOption.dataset.price) || 0;
        const quantity = parseInt(quantityInput.value) || 1;
        const total = price * quantity;
        totalPriceInput.value = total.toLocaleString();
      } else {
        totalPriceInput.value = '';
      }
    }

    // Cập nhật giá và tổng khi thay đổi món hoặc số lượng
    const drinkSelect = form.querySelector('#drinkSelect');
    drinkSelect.addEventListener('change', () => {
      const priceInput = form.querySelector('#price');
      const selectedOption = drinkSelect.options[drinkSelect.selectedIndex];
      priceInput.value = selectedOption.dataset.price ? parseInt(selectedOption.dataset.price).toLocaleString() : '';
      calculateTotalEdit();
    });

    const quantityInput = form.querySelector('#quantity');
    quantityInput.addEventListener('input', calculateTotalEdit);

    // Xử lý sự kiện submit form
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('Edit form submitted, formData:', Object.fromEntries(new FormData(form)));

      const formData = new FormData(form);
      const orderID = form.querySelector('#orderID').value;
      const orderDate = formData.get('orderDate');
      const totalPrice = formData.get('totalPrice').replace(/[^0-9]/g, '');
      const status = formData.get('status');
      const drinksID = form.querySelector('#drinkSelect').value;
      const tableID = form.querySelector('#tableSelect').value;
      const quantity = parseInt(form.querySelector('#quantity').value) || 1;

      if (!orderID || !orderDate || !totalPrice || !status || !drinksID || !tableID || !quantity) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
      }

      formData.set('orderID', orderID);
      formData.set('orderDate', orderDate);
      formData.set('totalPrice', parseInt(totalPrice) || 0);
      formData.set('status', status);
      formData.set('drinksID', drinksID);
      formData.set('tableID', tableID);
      formData.set('quantity', quantity);

      console.log('Sending formData to update_order.php:', Object.fromEntries(formData));

      fetch('../api/update_order.php', {
        method: 'POST',
        body: formData
      })
        .then(res => {
          if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
          return res.json();
        })
        .then(data => {
          console.log('Response từ API update_order:', data);
          if (data.success) {
            alert('Đã cập nhật đơn hàng!');
            orderForm.close();
            loadOrders(mainContent);
            if (tableID && order.tableID != tableID) {
              updateTableStatus(order.tableID, 'off', mainContent);
              updateTableStatus(tableID, 'on', mainContent);
            }
          } else {
            alert(`Cập nhật thất bại: ${data.message || 'Không xác định'}`);
          }
        })
        .catch(err => {
          console.error('Lỗi khi cập nhật đơn hàng:', err);
          alert('Lỗi kết nối hoặc server: ' + err.message);
        });
    });

    // Xử lý sự kiện nút Huỷ
    btnCancelOrder.addEventListener('click', () => {
      orderForm.close();
      form.reset();
    });
  } else {
    console.error('Không tìm thấy form hoặc các phần tử liên quan trong mainContent:', {
      orderForm, form, btnCancelOrder
    });
  }
}

function handleDeleteOrder(orderId, mainContent) {
  if (confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
    fetch('../api/delete_order.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ orderID: orderId })
    })
      .then(res => {
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        if (data.success) {
          alert('Đã xóa đơn hàng!');
          loadOrders(mainContent);
          fetch('../api/get_orders.php')
            .then(res => res.json())
            .then(orders => {
              const order = orders.data.find(o => o.orderID == orderId);
              if (order && order.tableID) {
                updateTableStatus(order.tableID, 'off', mainContent);
              }
            });
        } else {
          alert('Xóa thất bại: ' + (data.message || 'Không xác định'));
        }
      })
      .catch(err => {
        console.error('Lỗi khi xóa đơn hàng:', err);
        alert('Lỗi kết nối hoặc server: ' + err.message);
      });
  }
}

function updateTableStatus(tableId, status, mainContent) {
  fetch('../api/update_table_status.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ tableID: tableId, status: status })
  })
    .then(res => {
      if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
      return res.json();
    })
    .then(data => {
      if (data.success) {
        console.log(`Cập nhật trạng thái bàn ${tableId} thành ${status} thành công`);
      } else {
        console.error('Cập nhật trạng thái bàn thất bại:', data.message);
      }
    })
    .catch(err => console.error('Lỗi khi cập nhật trạng thái bàn:', err));
}