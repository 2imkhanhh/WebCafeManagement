function calculateSalary(formType) {
    let salaryInput, dayOffInput, infoElement;
    if (formType === 'add') {
      salaryInput = document.getElementById('salary');
      dayOffInput = document.getElementById('dayOff');
      infoElement = document.getElementById('addSalaryInfo');
    } else if (formType === 'edit') {
      salaryInput = document.getElementById('editSalary');
      dayOffInput = document.getElementById('editDayOff');
      infoElement = document.getElementById('editSalaryInfo');
    } else {
      return;
    }

    if (!salaryInput || !dayOffInput || !infoElement) {
      console.error('Một hoặc nhiều phần tử không được tìm thấy:', { salaryInput, dayOffInput, infoElement });
      return;
    }

    const originalSalary = parseFloat(salaryInput.value) || 0;
    const daysOff = parseInt(dayOffInput.value) || 0;
    const hourlyRate = 23000; // 23,000 VND mỗi tiếng
    const hoursPerDay = 6; // 6 tiếng mỗi ngày nghỉ
    const deductedAmount = daysOff * hoursPerDay * hourlyRate;
    const newSalary = originalSalary - deductedAmount;

    if (newSalary < 0) {
      infoElement.textContent = `Lỗi: Số tiền bị trừ (${deductedAmount.toLocaleString()} VND) vượt quá lương gốc (${originalSalary.toLocaleString()} VND). Lương đặt về 0 VND.`;
      salaryInput.value = '0.00';
      dayOffInput.value = '0';
      return;
    }

    salaryInput.value = newSalary.toFixed(2);
    infoElement.textContent = `Thông tin: Lương gốc ${originalSalary.toLocaleString()} VND - Trừ ${deductedAmount.toLocaleString()} VND ( ${daysOff} ngày × 6 tiếng × 23,000 VND) = Lương mới ${newSalary.toLocaleString()} VND.`;
  }

  function initStaffPage() {
    const btnShowForm = document.getElementById('btnShowForm');
    const btnCancelDialog = document.getElementById('btnCancelDialog');
    const staffForm = document.getElementById('staffForm');
    const staffList = document.getElementById('staffList');
    const addStaffDialog = document.getElementById('addStaffDialog');

    const editStaffDialog = document.getElementById('editStaffDialog');
    const editStaffForm = document.getElementById('editStaffForm');
    const btnCancelEdit = document.getElementById('btnCancelEdit');

    // Kiểm tra các phần tử
    if (!btnShowForm || !btnCancelDialog || !staffForm || !staffList || !addStaffDialog ||
        !editStaffDialog || !editStaffForm || !btnCancelEdit) {
      console.error('Một hoặc nhiều phần tử DOM không được tìm thấy:', {
        btnShowForm, btnCancelDialog, staffForm, staffList, addStaffDialog,
        editStaffDialog, editStaffForm, btnCancelEdit
      });
      return;
    }

    // Tải dữ liệu nhân viên
    fetch('../api/get_staff.php')
      .then(res => {
        if (!res.ok) throw new Error(`Lỗi HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Dữ liệu trả về không phải là mảng');
        staffList.innerHTML = data.map(staff => `
          <tr>
            <td>${staff.id}</td>
            <td>${staff.name}</td>
            <td>${staff.phone}</td>
            <td>${staff.role}</td>
            <td>${parseFloat(staff.salary).toLocaleString()} VND</td>
            <td>${parseInt(staff.day_off)}</td>
            <td><button class="btn-edit" data-id="${staff.id}">Sửa</button><button class="btn-delete" data-id="${staff.id}">Xóa</button></td>
          </tr>
        `).join('');
      })
      .catch(error => {
        console.error('Lỗi khi tải danh sách nhân viên:', error.message);
        staffList.innerHTML = '<tr><td colspan="7">Không thể tải dữ liệu. Vui lòng kiểm tra kết nối hoặc liên hệ admin.</td></tr>';
      });

    // Mở dialog thêm nhân viên
    btnShowForm.addEventListener('click', () => {
      addStaffDialog.showModal();
    });

    // Đóng dialog thêm nhân viên
    btnCancelDialog.addEventListener('click', () => {
      addStaffDialog.close();
      staffForm.reset();
      document.getElementById('addSalaryInfo').textContent = '';
    });

    // Xử lý thêm nhân viên
    staffForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newStaff = {
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    role: document.getElementById('role').value,
    salary: parseFloat(document.getElementById('salary').value),
    day_off: parseInt(document.getElementById('dayOff').value)
  };

  console.log('Gửi yêu cầu thêm đến:', '/CafeManagement (1)/api/add_staff.php');
  console.log('Dữ liệu gửi:', newStaff);

  fetch('/CafeManagement (1)/api/add_staff.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newStaff)
  })
  .then(res => {
    if (!res.ok) throw new Error(`Lỗi HTTP ${res.status}: ${res.statusText}`);
    return res.text(); // Sử dụng res.text() để debug phản hồi thô
  })
  .then(text => {
    console.log('Phản hồi thô từ server:', text);
    try {
      const data = JSON.parse(text);
      if (data.error) throw new Error(data.error);
      staffList.innerHTML += `
        <tr>
          <td>${data.id}</td>
          <td>${data.name}</td>
          <td>${data.phone}</td>
          <td>${data.role}</td>
          <td>${parseFloat(data.salary).toLocaleString()} VND</td>
          <td>${parseInt(data.day_off)}</td>
          <td><button class="btn-edit" data-id="${data.id}">Sửa</button><button class="btn-delete" data-id="${data.id}">Xóa</button></td>
        </tr>`;
      addStaffDialog.close();
      staffForm.reset();
      document.getElementById('addSalaryInfo').textContent = '';
    } catch (e) {
      console.error('Lỗi khi parse JSON:', e.message);
      throw new Error('Phản hồi từ server không phải JSON hợp lệ');
    }
  })
  .catch(error => console.error('Lỗi khi thêm nhân viên:', error.message));
});


    // Mở dialog sửa nhân viên
    staffList.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-edit')) {
        const id = e.target.getAttribute('data-id');
        fetch(`/CafeManagement (1)/api/get_staff.php?id=${id}`)
          .then(res => {
            if (!res.ok) throw new Error(`Lỗi HTTP ${res.status}: ${res.statusText}`);
            return res.json();
          })
          .then(data => {
            if (data.error) throw new Error(data.error);
            const staff = Array.isArray(data) ? data[0] : data;
            const editId = document.getElementById('editId');
            const editName = document.getElementById('editName');
            const editPhone = document.getElementById('editPhone');
            const editRole = document.getElementById('editRole');
            const editSalary = document.getElementById('editSalary');
            const editDayOff = document.getElementById('editDayOff');
            if (!editId || !editName || !editPhone || !editRole || !editSalary || !editDayOff) {
              throw new Error('Một hoặc nhiều trường input sửa không được tìm thấy');
            }
            editId.value = staff.id;
            editName.value = staff.name;
            editPhone.value = staff.phone;
            editRole.value = staff.role;
            editSalary.value = staff.salary;
            editDayOff.value = staff.day_off;
            editStaffDialog.showModal();
            document.getElementById('editSalaryInfo').textContent = '';
          })
          .catch(error => console.error('Lỗi khi tải thông tin nhân viên:', error.message));
      }

      if (e.target.classList.contains('btn-delete')) {
        const id = e.target.getAttribute('data-id');

        // Thêm hộp thoại xác nhận trước khi xóa
        const confirmDelete = confirm('Bạn có chắc chắn muốn xóa nhân viên này không?');
        if (!confirmDelete) return; // Nếu người dùng chọn "Hủy", thì không xóa

        fetch(`/CafeManagement (1)/api/delete_staff.php?id=${id}`, { method: 'DELETE' })
          .then(res => {
            if (!res.ok) throw new Error(`Lỗi HTTP ${res.status}: ${res.statusText}`);
            return res.json();
          })
          .then(() => e.target.closest('tr').remove())
          .catch(error => console.error('Lỗi khi xóa nhân viên:', error.message));
      }

    });

    // Đóng dialog sửa nhân viên
    btnCancelEdit.addEventListener('click', () => {
      editStaffDialog.close();
      editStaffForm.reset();
      document.getElementById('editSalaryInfo').textContent = '';
    });

    // Xử lý cập nhật nhân viên
    editStaffForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedStaff = {
        id: document.getElementById('editId').value,
        name: document.getElementById('editName').value,
        phone: document.getElementById('editPhone').value,
        role: document.getElementById('editRole').value,
        salary: parseFloat(document.getElementById('editSalary').value),
        day_off: parseInt(document.getElementById('editDayOff').value)
      };

      console.log('Gửi yêu cầu cập nhật đến:', '/CafeManagement (1)/api/update_staff.php');
      console.log('Dữ liệu gửi:', updatedStaff);

      fetch('/CafeManagement (1)/api/update_staff.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStaff)
      })
      .then(res => {
        if (!res.ok) throw new Error(`Lỗi HTTP ${res.status}: ${res.statusText}`);
        return res.text(); // Sử dụng res.text() để debug phản hồi thô
      })
      .then(text => {
        console.log('Phản hồi thô từ server:', text);
        try {
          const data = JSON.parse(text);
          if (data.error) throw new Error(data.error);
          let rowToUpdate = null;
          staffList.querySelectorAll("tr").forEach((row) => {
            const cell = row.querySelector("td");
            if (cell && cell.textContent.trim() === String(data.id)) {
              rowToUpdate = row;
            }
          });

         if (rowToUpdate) {
            rowToUpdate.innerHTML = `
              <td>${data.id}</td>
              <td>${data.name}</td>
              <td>${data.phone}</td>
              <td>${data.role}</td>
              <td>${parseFloat(data.salary).toLocaleString()} VND</td>
              <td>${parseInt(data.day_off)}</td>
              <td><button class="btn-edit" data-id="${data.id}">Sửa</button><button class="btn-delete" data-id="${data.id}">Xóa</button></td>
            `;
          }

          editStaffDialog.close();
          editStaffForm.reset();
          document.getElementById('editSalaryInfo').textContent = '';
          alert('Cập nhật nhân viên thành công!');
        } catch (e) {
          console.error('Lỗi khi parse JSON:', e.message);
          throw new Error('Phản hồi từ server không phải JSON hợp lệ');
        }
      })
      .catch(error => console.error('Lỗi khi cập nhật nhân viên:', error.message));
    });
  }

  // Polyfill cho :contains
  if (!('contains' in Element.prototype)) {
    Element.prototype.contains = function(text) {
      return this.textContent.includes(text);
    };
  }