const apiUrl = '../api/statistics.php';
let chartInstance = null;

function initStatisticsPage() {
  const monthSelect = document.getElementById('monthSelect');
  for (let i = 1; i <= 12; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Tháng ${i}`;
    monthSelect.appendChild(opt);
  }

  const now = new Date();
  monthSelect.value = now.getMonth() + 1;

  loadChartData(now.getFullYear(), monthSelect.value);

  monthSelect.addEventListener('change', () => {
    loadChartData(now.getFullYear(), monthSelect.value);
  });
}

async function loadChartData(year, month) {
  try {
    const response = await fetch(`${apiUrl}?year=${year}&month=${month}`);
    const text = await response.text();

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('Phản hồi không hợp lệ:', text);
      alert('Lỗi dữ liệu từ API');
      return;
    }

    if (result.success) {
      const labels = result.data.map(r => `Ngày ${r.day}`);
      const data = result.data.map(r => parseFloat(r.total));

      // Tìm giá trị max thực tế
      const maxData = data.length > 0 ? Math.max(...data) : 0;
      // Đặt giá trị max đề xuất hợp lý (ít nhất 1000 VND để không bị méo)
      const suggestedMax = maxData > 0 ? maxData * 1.2 : 1000;

      if (chartInstance) {
        chartInstance.destroy();
      }

      const ctx = document.getElementById('chartCanvas').getContext('2d');
      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: `Doanh thu tháng ${month}`,
            data,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0,123,255,0.2)',
            fill: true,
            tension: 0.3,
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax: suggestedMax,
              ticks: {
                callback: value => value.toLocaleString('vi-VN') + ' VND'
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                boxWidth: 20
              }
            }
          }
        }
      });

    } else {
      alert(result.error || 'Không tải được dữ liệu');
    }

  } catch (err) {
    console.error('Lỗi API:', err);
    alert('Không thể kết nối API');
  }
}

window.addEventListener('load', initStatisticsPage);
