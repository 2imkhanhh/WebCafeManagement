<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../model/StatisticsModel.php';

$db = new Database();
$conn = $db->getConnection();

$model = new StatisticsModel($conn);

try {
    $year = isset($_GET['year']) ? (int)$_GET['year'] : date('Y');
    $month = isset($_GET['month']) ? (int)$_GET['month'] : date('m');

    $data = $model->getRevenueByMonth($year, $month);

    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
