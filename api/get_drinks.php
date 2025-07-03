<?php
header('Content-Type: application/json');

try {
    require_once("../config/database.php");
    require_once("../model/DrinkModel.php");

    $db = new Database();
    $conn = $db->getConnection();

    if ($conn === false) {
        throw new Exception("Kết nối database thất bại: " . (new mysqli())->connect_error);
    }

    $result = DrinkModel::getAllDrinks($conn);

    if ($result === false) {
        throw new Exception("Lỗi khi truy vấn danh sách món: " . $conn->error);
    }

    $drinks = [];
    while ($row = $result->fetch_assoc()) {
        $drinks[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $drinks]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>