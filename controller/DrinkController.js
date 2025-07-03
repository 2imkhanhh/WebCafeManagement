export function loadDrinks(mainContent) {
  const drinkGrid = mainContent.querySelector('#drinkGrid');

  fetch('../api/get_drinks.php')
    .then(res => {
      if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
      return res.json();
    })
    .then(data => {
      console.log('Dữ liệu món từ API:', data);
      if (drinkGrid) {
        drinkGrid.innerHTML = '';
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          data.data.forEach(item => {
            const drink = document.createElement('div');
            drink.className = 'drink-item';
            drink.innerHTML = `
              <img src="${item.Image || ''}" alt="${item.Name || 'Hình ảnh không có'}">
              <h3>${item.Name || 'Tên không có'}</h3>
              <p>${parseInt(item.Price || 0).toLocaleString()}đ</p>
              <div class="action-buttons">
                <button class="btn-edit" data-id="${item.ID || item.drinksID}">Sửa</button>
                <button class="btn-delete" data-id="${item.drinksID || item.ID}">Xoá</button>
              </div>
            `;
            drinkGrid.appendChild(drink);

            const editBtn = drink.querySelector('.btn-edit');
            editBtn.addEventListener('click', () => openEditPopup(mainContent, item));

            const deleteBtn = drink.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', () => handleDeleteDrink(item.drinksID || item.ID, mainContent));
          });
        } else {
          drinkGrid.innerHTML = '<p>Không có món nào hoặc xảy ra lỗi: ' + (data.message || 'Dữ liệu trống') + '</p>';
        }
      } else {
        console.error('Không tìm thấy phần tử #drinkGrid');
      }
    })
    .catch(err => console.error('Lỗi khi tải danh sách món:', err));
}

export function handleDeleteDrink(drinksID, mainContent) {
  if (confirm('Bạn có chắc chắn muốn xóa món này?')) {
    fetch(`../api/delete_drink.php?id=${drinksID}`, {
      method: 'DELETE',
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('Đã xóa món thành công!');
          loadDrinks(mainContent);
        } else {
          alert(`Xóa thất bại: ${data.message || 'Lỗi không xác định'}`);
        }
      })
      .catch(err => {
        console.error('Lỗi khi gửi yêu cầu:', err);
        alert('Lỗi kết nối server!');
      });
  }
}

export function handleAddDrink(mainContent) {
  const form = mainContent.querySelector('#drinkForm');
  const addForm = mainContent.querySelector('#add-form');

  if (form && addForm) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);

      // Debug
      const category = form.querySelector('#loaiDoUong').value;
      console.log('Giá trị Category gửi đi:', category);

      fetch('../api/add_drink.php', {
        method: 'POST',
        body: formData
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data.success) {
            alert('Đã thêm món!');
            addForm.close();
            form.reset();
            loadDrinks(mainContent);
          } else {
            alert(`Lỗi khi thêm món: ${data.message || 'Không xác định'}`);
          }
        })
        .catch(err => {
          console.error('Lỗi khi thêm món:', err);
          alert('Lỗi kết nối hoặc server: ' + err.message);
        });
    });
  } else {
    console.error('Không tìm thấy form hoặc #add-form');
  }
}

function openEditPopup(mainContent, item) {
  const editForm = mainContent.querySelector('#edit-form');
  const form = mainContent.querySelector('#editDrinkForm');

  if (editForm && form) {
    // Điền các giá trị cơ bản
    form.querySelector('#editID').value = item.drinksID || item.ID;
    form.querySelector('#editTenMon').value = item.Name || '';
    form.querySelector('#editGia').value = item.Price || '';
    form.querySelector('#editOldImage').value = item.Image || '';

    // Lấy danh sách category và điền vào select
    const categorySelect = form.querySelector('#editLoaiDoUong');
    if (!categorySelect) {
      console.error('Phần tử #editLoaiDoUong không tồn tại trong DOM');
      return;
    }

    fetch('../api/get_categories.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          categorySelect.innerHTML = '<option value="">-- Chọn loại đồ uống --</option>';
          data.data.forEach(category => {
            const option = document.createElement('option');
            option.value = category.Name;
            option.textContent = category.Name;
            categorySelect.appendChild(option);
          });
          // Chọn category hiện tại của món dựa trên categoryID
          const currentCategory = data.data.find(cat => cat.categoryID === item.categoryID);
          if (currentCategory) {
            categorySelect.value = currentCategory.Name;
          }
          console.log('Danh sách category trong edit popup:', categorySelect.innerHTML);
          console.log('Category hiện tại:', currentCategory ? currentCategory.Name : 'Không tìm thấy');
        }
      })
      .catch(err => console.error('Lỗi khi lấy danh sách category:', err));

    editForm.showModal();

    const cancelBtn = mainContent.querySelector('#btnCancelEdit');
    if (cancelBtn) {
      cancelBtn.onclick = () => editForm.close();
    }

    form.onsubmit = function (e) {
      e.preventDefault();
      const formData = new FormData(form);

      const fileInput = form.querySelector('#editHinhAnh');
      if (!fileInput.files || fileInput.files.length === 0) {
        formData.delete('Image');
      }

      fetch('../api/update_drink.php', {
        method: 'POST',
        body: formData
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data.success) {
            alert('Đã cập nhật món!');
            editForm.close();
            loadDrinks(mainContent);
          } else {
            alert('Cập nhật thất bại: ' + (data.message || 'Không xác định'));
          }
        })
        .catch(err => {
          console.error('Lỗi khi cập nhật món:', err);
          alert('Lỗi kết nối hoặc server: ' + err.message);
        });
    };
  } else {
    console.error('Không tìm thấy #edit-form hoặc #editDrinkForm');
  }
}

export function loadCategories(mainContent) {
  const categoryButtons = mainContent.querySelector('#category-buttons');
  const addCategorySelect = mainContent.querySelector('#loaiDoUong');

  fetch('../api/get_categories.php')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (data.success) {
        // Điền vào category-buttons
        if (categoryButtons) {
          categoryButtons.innerHTML = '';
          data.data.forEach(category => {
            const button = document.createElement('button');
            button.textContent = category.Name;
            button.className = 'category-btn';
            button.dataset.categoryId = category.categoryID;
            button.addEventListener('click', () => filterDrinksByCategory(mainContent, category.categoryID));
            categoryButtons.appendChild(button);
          });
        }

        // Điền vào dropdown trong form thêm món
        if (addCategorySelect) {
          addCategorySelect.innerHTML = '<option value="">-- Chọn loại đồ uống --</option>';
          data.data.forEach(category => {
            const option = document.createElement('option');
            option.value = category.Name;
            option.textContent = category.Name;
            addCategorySelect.appendChild(option);
          });
          console.log('Danh sách category trong add form:', addCategorySelect.innerHTML);
        }
      } else {
        console.error('Lỗi từ server:', data.message);
      }
    })
    .catch(err => console.error('Error loading categories:', err));
}

function filterDrinksByCategory(mainContent, categoryId) {
  const drinkGrid = mainContent.querySelector('#drinkGrid');

  fetch('../api/get_drinks.php')
    .then(res => {
      if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} - ${res.statusText}`);
      return res.json();
    })
    .then(data => {
      if (drinkGrid) {
        drinkGrid.innerHTML = '';
        if (data.success && Array.isArray(data.data)) {
          const filteredDrinks = data.data.filter(item => item.categoryID === categoryId);
          if (filteredDrinks.length === 0) {
            drinkGrid.innerHTML = '<p>Không có đồ uống nào thuộc loại này.</p>';
          } else {
            filteredDrinks.forEach(item => {
              const drink = document.createElement('div');
              drink.className = 'drink-item';
              drink.innerHTML = `
                <img src="${item.Image || ''}" alt="${item.Name || 'Hình ảnh không có'}">
                <h3>${item.Name || 'Tên không có'}</h3>
                <p>${parseInt(item.Price || 0).toLocaleString()}đ</p>
                <div class="action-buttons">
                  <button class="btn-edit" data-id="${item.drinksID || item.ID}">Sửa</button>
                  <button class="btn-delete" data-id="${item.drinksID || item.ID}">Xoá</button>
                </div>
              `;
              drinkGrid.appendChild(drink);

              const editBtn = drink.querySelector('.btn-edit');
              editBtn.addEventListener('click', () => openEditPopup(mainContent, item));

              const deleteBtn = drink.querySelector('.btn-delete');
              deleteBtn.addEventListener('click', () => handleDeleteDrink(item.drinksID || item.ID, mainContent));
            });
          }
        } else {
          drinkGrid.innerHTML = '<p>Không tải được danh sách món: ' + (data.message || 'Dữ liệu trống') + '</p>';
        }
      }
    })
    .catch(err => console.error('Lỗi khi lọc món:', err));
}

export function initDrinksPage(mainContent) {
  loadDrinks(mainContent);
  loadCategories(mainContent);
  handleAddDrink(mainContent);

  const btnShowForm = mainContent.querySelector('#btnShowForm');
  const btnCancel = mainContent.querySelector('#btnCancel');
  const addForm = mainContent.querySelector('#add-form');

  if (btnShowForm && addForm) {
    btnShowForm.addEventListener('click', () => {
      addForm.showModal();
    });
  }

  if (btnCancel && addForm) {
    btnCancel.addEventListener('click', () => {
      addForm.close();
      const form = mainContent.querySelector('#drinkForm');
      if (form) form.reset();
    });
  }
}