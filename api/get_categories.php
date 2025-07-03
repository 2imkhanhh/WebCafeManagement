<?php
header('Content-Type: application/json');

try {
    if (!file_exists('../config/database.php') || !file_exists('../model/DrinkModel.php')) {
        throw new Exception("Không tìm thấy file database.php hoặc DrinkModel.php");
    }
    require_once("../config/database.php");
    require_once("../model/DrinkModel.php");

    $db = new Database();
    $conn = $db->getConnection();

    if ($conn === false) {
        throw new Exception("Kết nối database thất bại: " . (new mysqli())->connect_error);
    }

    $sql = "SELECT categoryID, Name FROM category";
    $result = $conn->query($sql);

    if ($result === false) {
        throw new Exception("Lỗi truy vấn: " . $conn->error);
    }

    $categories = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode(['success' => true, 'data' => $categories]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>