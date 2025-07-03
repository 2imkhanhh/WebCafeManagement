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

    $drinksID = $_GET['drinksID'] ?? null;
    if (!$drinksID) {
        throw new Exception("drinksID không được cung cấp");
    }

    $drink = DrinkModel::getDrinkById($conn, $drinksID);
    if ($drink) {
        echo json_encode(['success' => true, 'data' => $drink]);
    } else {
        echo json_encode(['success' => true, 'data' => null, 'message' => 'Không tìm thấy món']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>