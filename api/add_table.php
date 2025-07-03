<?php
header('Content-Type: application/json');

try {
    require_once("../config/database.php");
    require_once("../model/TableModel.php");

    $db = new Database();
    $conn = $db->getConnection();

    $name = $_POST["tableName"];
    $status = "off"; 
    $orderID = isset($_POST["orderID"]) ? (int)$_POST["orderID"] : null; // Mặc định NULL nếu không có

    $success = TableModel::addTable($conn, $name, $status, $orderID);

    echo json_encode([
        "success" => $success,
        "message" => $success ? "Thêm bàn thành công" : "Thêm bàn thất bại"
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>