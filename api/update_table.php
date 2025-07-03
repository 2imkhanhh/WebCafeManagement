<?php
header('Content-Type: application/json');

try {
    require_once("../config/database.php");
    require_once("../model/TableModel.php");

    $db = new Database();
    $conn = $db->getConnection();

    $id = $_POST["tableID"];
    $name = $_POST["tableName"];
    $status = $_POST["status"];
    $orderID = isset($_POST["orderID"]) ? (int)$_POST["orderID"] : null;

    $success = TableModel::updateTable($conn, $id, $name, $status, $orderID);

    echo json_encode([
        "success" => $success,
        "message" => $success ? "Cập nhật bàn thành công" : "Cập nhật bàn thất bại"
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>