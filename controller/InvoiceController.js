export default {
  initInvoices(mainContent) {
    const grid = mainContent.querySelector('#invoiceGrid');
    fetch('../api/get_invoices.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          grid.innerHTML = '';
          data.data.forEach(inv => {
            const div = document.createElement('div');
            div.className = 'invoice-item';
            div.innerHTML = `
              <h3>Hóa đơn #${inv.invoiceID}</h3>
              <p>Order ID: ${inv.orderID}</p>
              <p>Ngày: ${inv.orderDate}</p>
              <p>Tổng tiền: ${parseInt(inv.totalPrice).toLocaleString()}đ</p>
              <button class="btn-view-details" data-id="${inv.orderID}">Xem chi tiết</button>
            `;
            div.querySelector('button').addEventListener('click', () => {
              showInvoiceDetails(inv.orderID);
            });
            grid.appendChild(div);
          });
        } else {
          grid.innerHTML = '<p>Không có dữ liệu hóa đơn.</p>';
          console.error('Lỗi API:', data.message);
        }
      })
      .catch(err => {
        grid.innerHTML = '<p>Lỗi khi tải hóa đơn.</p>';
        console.error('Lỗi fetch:', err);
      });
  }
};


function showInvoiceDetails(orderID) {
  const dialog = document.getElementById('invoice-details-dialog');
  const content = document.getElementById('invoice-details-content');

  content.innerHTML = '<p>Đang tải...</p>';
  dialog.showModal();

  fetch(`../api/get_order_details.php?orderID=${orderID}`)
    .then(res => res.json())
    .then(data => {
      if (data.success && data.data.length > 0) {
        const list = data.data.map(d => `
          <li>${d.Name} - SL: ${d.quantity} - Giá: ${parseInt(d.price).toLocaleString()}đ</li>
        `).join('');
        content.innerHTML = `<ul>${list}</ul>`;
      } else {
        content.innerHTML = '<p>Không có dữ liệu.</p>';
      }
    });

  document.getElementById('btnCloseInvoiceDetails').onclick = () => dialog.close();
}
