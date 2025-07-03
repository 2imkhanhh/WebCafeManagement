<?php
header('Content-Type: application/json');

try {
    require_once("../config/database.php");
    require_once("../model/TableModel.php");

    $db = new Database();
    $conn = $db->getConnection();

    $id = $_POST["tableID"];

    $success = TableModel::deleteTable($conn, $id);

    echo json_encode([
        "success" => $success,
        "message" => $success ? "Xóa bàn thành công" : "Xóa bàn thất bại"
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>