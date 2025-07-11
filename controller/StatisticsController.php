<?php
require_once '../model/StatisticsModel.php';
require_once '../config/database.php'; // kết nối DB

$db = (new Database())->connect(); 
$model = new StatisticsModel($db);

// Lấy dữ liệu từ API
$year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');
$month = isset($_GET['month']) ? intval($_GET['month']) : date('m');

$data = $model->getRevenueByMonth($year, $month);

// Xuất JSON
echo json_encode([
  'success' => true,
  'data' => $data
]);
?>
