class OrderController {
  static async init(mainContent) {
    try {
      this.loadOrders(mainContent);
      this.handleAddOrder(mainContent);
    } catch (err) {
      console.error('Lỗi khi khởi tạo OrderController:', err);
      mainContent.querySelector('#orderGrid').innerHTML = '<p>Lỗi: Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.</p>';
    }
  }

  static loadOrders(mainContent) {
    const orderGrid = mainContent.querySelector('#orderGrid');
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
            const paymentStatus = item.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';
            const tableName = item.Name || 'Chưa có';
            console.log(`Order #${item.orderID}: tableID=${item.tableID}, tableName=${tableName}, status=${item.status}`);

            order.innerHTML = `
              <h3>Đơn hàng #${item.orderID}</h3>
              <p>Ngày: ${orderDate}</p>
              <p>Tổng: ${parseInt(item.totalPrice).toLocaleString()}đ</p>
              <p>Trạng thái: ${paymentStatus}</p>
              <p>Bàn: ${tableName}</p>
              <div class="action-buttons">
                ${item.status === 'paid' ? '' : `<button class="btn-edit" data-id="${item.orderID}">Sửa</button>`}
                ${item.status === 'paid' ? '' : `<button class="btn-delete" data-id="${item.orderID}">Xoá</button>`}
              </div>
            `;
            orderGrid.appendChild(order);

            if (item.status !== 'paid') {
              order.querySelector('.btn-edit')?.addEventListener('click', () => this.openEditPopup(mainContent, item));
              order.querySelector('.btn-delete')?.addEventListener('click', () => this.handleDeleteOrder(item.orderID, mainContent));
            }
          });
        } else {
          orderGrid.innerHTML = '<p>Không có đơn hàng nào.</p>';
        }
      })
      .catch(err => {
        console.error('Lỗi khi tải danh sách đơn hàng:', err);
        orderGrid.innerHTML = '<p>Lỗi: Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.</p>';
      });
  }

  static handleAddOrder(mainContent) {
    const form = mainContent.querySelector('#addOrderForm');
    const orderForm = mainContent.querySelector('#add-form');
    const btnShowOrderForm = mainContent.querySelector('#btnShowOrderForm');
    const btnCancelOrder = mainContent.querySelector('#btnCancel');

    if (form && orderForm && btnShowOrderForm && btnCancelOrder) {
      btnShowOrderForm.addEventListener('click', () => {
        orderForm.showModal();
        this.loadSelectOptions(orderForm);
        form.reset();
        form.querySelector('#status').value = 'unpaid'; // Mặc định ẩn
        form.querySelector('#statusDisplay').value = 'Chưa thanh toán'; // Hiển thị
        const orderItems = orderForm.querySelector('#orderItems');
        orderItems.innerHTML = '<h4>Chọn món:</h4>'; // Xóa tất cả các ô hiện tại
        // Luôn hiển thị 1 ô mặc định
        const newItem = document.createElement('div');
        newItem.className = 'order-item';
        newItem.innerHTML = `<select name="drinksID[]" required></select>
                             <input type="number" name="quantity[]" value="1" min="1" required>
                             <button type="button" class="btn-remove-item">Xóa</button>`;
        orderItems.appendChild(newItem);
        this.loadDrinksForSelect(newItem.querySelector('select'));
        this.setupEventListeners(newItem);
        this.calculateTotal(orderForm);
      });

      btnCancelOrder.addEventListener('click', () => orderForm.close());

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const orderData = {
          orderDate: formData.get('orderDate'),
          totalPrice: parseInt(formData.get('totalPrice').replace(/[^0-9]/g, '')),
          status: 'unpaid', // Mặc định là chưa thanh toán
          tableID: formData.get('tableID'),
          items: []
        };
        console.log('Dữ liệu gửi đi:', orderData);
        const drinksIDs = form.querySelectorAll('select[name="drinksID[]"]');
        const quantities = form.querySelectorAll('input[name="quantity[]"]');
        drinksIDs.forEach((select, index) => {
          if (select.value && quantities[index].value) {
            orderData.items.push({
              drinksID: select.value,
              quantity: quantities[index].value
            });
          }
        });

        if (orderData.items.length === 0) {
          alert('Vui lòng chọn ít nhất một món!');
          return;
        }

        try {
          const response = await fetch('../api/add_order.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
          });
          if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status} - ${res.statusText}`);
          const data = await response.json();
          console.log('Phản hồi từ API:', data);
          if (data.success) {
            alert('Đã thêm đơn hàng!');
            orderForm.close();
            this.loadOrders(mainContent);
            if (orderData.tableID) {
              const newOrderId = data.orderID; // Giả sử API trả về orderID
              this.updateTableStatus(orderData.tableID, 'on', newOrderId, mainContent);
            }
          } else {
            alert(`Lỗi khi thêm đơn hàng: ${data.message || 'Không xác định'}`);
          }
        } catch (err) {
          console.error('Lỗi khi gửi yêu cầu:', err);
          alert('Lỗi kết nối hoặc server: ' + err.message);
        }
      });

      document.getElementById('btnAddItem').addEventListener('click', () => {
        const orderItems = orderForm.querySelector('#orderItems');
        const newItem = document.createElement('div');
        newItem.className = 'order-item';
        newItem.innerHTML = `<select name="drinksID[]" required></select>
                             <input type="number" name="quantity[]" value="1" min="1" required>
                             <button type="button" class="btn-remove-item">Xóa</button>`;
        orderItems.appendChild(newItem);
        this.loadDrinksForSelect(newItem.querySelector('select'));
        this.setupEventListeners(newItem);
        this.calculateTotal(orderForm);
      });

      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-item')) {
          e.target.parentElement.remove();
          this.calculateTotal(orderForm);
        }
      });

      this.setupEventListeners(orderForm);
    } else {
      console.error('Không tìm thấy form hoặc các phần tử liên quan:', { form, orderForm, btnShowOrderForm, btnCancelOrder });
    }
  }

  static openEditPopup(mainContent, order) {
    const orderForm = mainContent.querySelector('#edit-form');
    const form = mainContent.querySelector('#editOrderForm');
    const btnCancelOrder = mainContent.querySelector('#btnCancelEdit');
    const btnAddItem = orderForm ? orderForm.querySelector('#btnAddItem') : null;
    const currentTableDisplay = form ? form.querySelector('#currentTableDisplay') : null;
    const tableSelect = form ? form.querySelector('#tableSelect') : null;

    console.log('Kiểm tra phần tử:', { orderForm, form, btnCancelOrder, btnAddItem, currentTableDisplay, tableSelect });

    if (orderForm && form && btnCancelOrder && btnAddItem && currentTableDisplay && tableSelect) {
      orderForm.showModal();
      form.querySelector('#orderID').value = order.orderID;
      form.querySelector('#orderDate').value = order.orderDate.split(' ')[0];
      form.querySelector('#totalPrice').value = parseInt(order.totalPrice).toLocaleString() + 'đ';
      form.querySelector('#status').value = order.status; // Ẩn, giữ nguyên giá trị
      form.querySelector('#statusDisplay').value = order.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'; // Hiển thị
      form.querySelector('#statusDisplay').disabled = true; // Không cho phép sửa

      currentTableDisplay.textContent = order.Name ? `Bàn hiện tại: ${order.Name} (ID: ${order.tableID})` : 'Không có bàn';
      this.loadTablesForSelectEdit(tableSelect, order.tableID);
      tableSelect.value = order.tableID || '';

      const orderItems = form.querySelector('#orderItems');
      orderItems.innerHTML = '<h4>Chọn món:</h4>';
      fetch('../api/get_order_details.php?orderID=' + order.orderID)
        .then(res => {
          if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
          return res.json();
        })
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            const itemElements = [];
            data.data.forEach(item => {
              const newItem = document.createElement('div');
              newItem.className = 'order-item';
              newItem.innerHTML = `<select name="drinksID[]" required></select>
                                  <input type="number" name="quantity[]" value="${item.quantity || 1}" min="1" required>
                                  <button type="button" class="btn-remove-item">Xóa</button>`;
              orderItems.appendChild(newItem);
              itemElements.push({ element: newItem.querySelector('select'), selectedId: item.drinksID });
            });

            const loadPromises = itemElements.map(({ element, selectedId }) =>
              new Promise(resolve => {
                this.loadDrinksForSelect(element, selectedId, () => resolve());
              })
            );
            Promise.all(loadPromises).then(() => {
              this.calculateTotal(orderForm);
              this.setupEventListeners(orderForm);
            });
          } else {
            console.warn('Không có chi tiết đơn hàng:', data);
            orderItems.innerHTML += '<p>Không có món nào trong đơn hàng.</p>';
          }
        })
        .catch(err => {
          console.error('Lỗi khi tải chi tiết đơn hàng:', err);
          orderItems.innerHTML += '<p>Lỗi: Không thể tải chi tiết đơn hàng.</p>';
        });

      btnCancelOrder.addEventListener('click', () => orderForm.close());

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (order.status === 'paid') {
          alert('Đơn hàng đã thanh toán, không thể sửa!');
          return;
        }
        const formData = new FormData(form);
        const orderData = {
          orderID: formData.get('orderID'),
          orderDate: formData.get('orderDate'),
          totalPrice: parseInt(formData.get('totalPrice').replace(/[^0-9]/g, '')),
          status: order.status, // Giữ nguyên trạng thái hiện tại
          tableID: formData.get('tableID') || order.tableID,
          items: []
        };
        const drinksIDs = form.querySelectorAll('select[name="drinksID[]"]');
        const quantities = form.querySelectorAll('input[name="quantity[]"]');
        drinksIDs.forEach((select, index) => {
          if (select.value && quantities[index].value) {
            orderData.items.push({
              drinksID: select.value,
              quantity: quantities[index].value
            });
          }
        });

        fetch('../api/update_order.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        })
        .then(res => {
          if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
          return res.json();
        })
        .then(data => {
          if (data.success) {
            alert('Đã cập nhật đơn hàng!');
            orderForm.close();
            this.loadOrders(mainContent);
            if (orderData.tableID && order.tableID !== orderData.tableID) {
              fetch('../api/update_table_status.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ tableID: order.tableID, status: 'off', orderID: 0 })
              })
              .then(res => res.json())
              .then(statusData => {
                if (statusData.success) console.log(`Cập nhật bàn ${order.tableID} thành công`);
              })
              .catch(err => console.error('Lỗi khi cập nhật bàn cũ:', err));

              fetch('../api/update_table_status.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ tableID: orderData.tableID, status: 'on', orderID: orderData.orderID })
              })
              .then(res => res.json())
              .then(statusData => {
                if (statusData.success) console.log(`Cập nhật bàn ${orderData.tableID} thành công`);
              })
              .catch(err => console.error('Lỗi khi cập nhật bàn mới:', err));
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

      const existingAddItemListener = btnAddItem._addItemListener;
      if (existingAddItemListener) btnAddItem.removeEventListener('click', existingAddItemListener);
      btnAddItem._addItemListener = () => {
        const orderItems = orderForm.querySelector('#orderItems');
        const newItem = document.createElement('div');
        newItem.className = 'order-item';
        newItem.innerHTML = `<select name="drinksID[]" required></select>
                            <input type="number" name="quantity[]" value="1" min="1" required>
                            <button type="button" class="btn-remove-item">Xóa</button>`;
        orderItems.appendChild(newItem);
        this.loadDrinksForSelect(newItem.querySelector('select'));
        this.setupEventListeners(newItem);
        this.calculateTotal(orderForm);
      };
      btnAddItem.addEventListener('click', btnAddItem._addItemListener);

      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-item')) {
          e.target.parentElement.remove();
          this.calculateTotal(orderForm);
        }
      });
    } else {
      console.error('Không tìm thấy form hoặc các phần tử liên quan:', { orderForm, form, btnCancelOrder, btnAddItem, currentTableDisplay, tableSelect });
    }
  }

  static handleDeleteOrder(orderId, mainContent) {
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
          this.loadOrders(mainContent);
          fetch('../api/get_orders.php')
            .then(res => res.json())
            .then(orders => {
              const order = orders.data.find(o => o.orderID == orderId);
              if (order && order.tableID) {
                this.updateTableStatus(order.tableID, 'off', 0, mainContent);
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

  static updateTableStatus(tableId, status, orderId, mainContent) {
    fetch('../api/update_table_status.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ tableID: tableId, status: status, orderID: orderId || 0 })
    })
    .then(res => {
      if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
      return res.json();
    })
    .then(data => {
      if (data.success) {
        console.log(`Cập nhật trạng thái bàn ${tableId} thành ${status} với orderID ${orderId || 0} thành công`);
        this.loadOrders(mainContent);
      } else {
        console.error('Cập nhật trạng thái bàn thất bại:', data.message);
      }
    })
    .catch(err => console.error('Lỗi khi cập nhật trạng thái bàn:', err));
  }

  static loadSelectOptions(orderForm) {
    this.loadTablesForSelect(orderForm.querySelector('#tableSelect'));
    const drinkSelects = orderForm.querySelectorAll('select[name="drinksID[]"]');
    drinkSelects.forEach(select => this.loadDrinksForSelect(select));
  }

  static loadTablesForSelect(select) {
    fetch('../api/get_tables.php')
      .then(res => {
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        console.log('Dữ liệu từ get_tables.php:', data);
        if (data.success && Array.isArray(data.data)) {
          select.innerHTML = '<option value="">-- Chọn bàn trống --</option>';
          const availableTables = data.data.filter(table => table.Status === 'off');
          if (availableTables.length > 0) {
            availableTables.forEach(table => {
              const option = document.createElement('option');
              option.value = table.tableID;
              option.textContent = `Bàn ${table.Name} (ID: ${table.tableID})`;
              select.appendChild(option);
            });
          } else {
            select.innerHTML += '<option value="" disabled>Không có bàn trống</option>';
          }
        } else {
          console.warn('Không có dữ liệu bàn hoặc API trả về lỗi:', data);
          select.innerHTML = '<option value="" disabled>Không thể tải danh sách bàn</option>';
        }
      })
      .catch(err => {
        console.error('Lỗi khi tải danh sách bàn:', err);
        select.innerHTML = '<option value="" disabled>Không thể tải danh sách bàn</option>';
      });
  }

  static loadTablesForSelectEdit(select, currentTableID) {
    fetch('../api/get_tables.php')
      .then(res => {
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        console.log('Dữ liệu từ get_tables.php cho form sửa:', data);
        if (data.success && Array.isArray(data.data)) {
          select.innerHTML = '<option value="">-- Chọn bàn trống --</option>';
          const availableTables = data.data.filter(table => table.Status === 'off');
          if (availableTables.length > 0) {
            availableTables.forEach(table => {
              const option = document.createElement('option');
              option.value = table.tableID;
              option.textContent = `${table.Name} (ID: ${table.tableID})`;
              if (table.tableID == currentTableID && table.Status === 'off') {
                option.selected = true;
              }
              select.appendChild(option);
            });
          } else {
            select.innerHTML += '<option value="" disabled>Không có bàn trống</option>';
          }
        } else {
          console.warn('Không có dữ liệu bàn hoặc API trả về lỗi:', data);
          select.innerHTML = '<option value="" disabled>Không thể tải danh sách bàn</option>';
        }
      })
      .catch(err => {
        console.error('Lỗi khi tải danh sách bàn cho form sửa:', err);
        select.innerHTML = '<option value="" disabled>Không thể tải danh sách bàn</option>';
      });
  }

  static loadDrinksForSelect(select, selectedId = null, callback = () => {}) {
    fetch('../api/get_drinks.php')
      .then(res => {
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        console.log('Dữ liệu từ get_drinks.php:', data);
        if (data.success && Array.isArray(data.data)) {
          select.innerHTML = '<option value="">-- Chọn món --</option>';
          data.data.forEach(drink => {
            const option = document.createElement('option');
            option.value = drink.drinksID;
            option.textContent = `${drink.Name} (${drink.Price}đ)`;
            option.dataset.price = drink.Price || 0;
            if (drink.drinksID == selectedId) option.selected = true;
            select.appendChild(option);
          });
        } else {
          console.warn('Không có dữ liệu món hoặc API trả về lỗi:', data);
          select.innerHTML = '<option value="" disabled>Không thể tải danh sách món</option>';
        }
        callback();
      })
      .catch(err => {
        console.error('Lỗi khi tải danh sách món:', err);
        select.innerHTML = '<option value="" disabled>Không thể tải danh sách món</option>';
        callback();
      });
  }

  static calculateTotal(orderForm) {
    let total = 0;
    const quantities = orderForm.querySelectorAll('input[name="quantity[]"]');
    const drinkSelects = orderForm.querySelectorAll('select[name="drinksID[]"]');
    drinkSelects.forEach((select, index) => {
      const price = parseInt(select.options[select.selectedIndex]?.dataset.price) || 0;
      const quantity = parseInt(quantities[index].value) || 1;
      total += price * quantity;
    });
    orderForm.querySelector('#totalPrice').value = total.toLocaleString() + 'đ';
  }

  static setupEventListeners(container) {
    const drinkSelects = container.querySelectorAll('select[name="drinksID[]"]');
    drinkSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        const orderForm = e.target.closest('dialog#add-form') || e.target.closest('dialog#edit-form');
        if (orderForm) this.calculateTotal(orderForm);
      });
    });

    const quantities = container.querySelectorAll('input[name="quantity[]"]');
    quantities.forEach(input => {
      input.addEventListener('input', (e) => {
        const orderForm = e.target.closest('dialog#add-form') || e.target.closest('dialog#edit-form');
        if (orderForm) this.calculateTotal(orderForm);
      });
    });
  }
}

export default OrderController;