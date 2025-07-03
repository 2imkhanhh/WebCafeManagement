<?php
header('Content-Type: application/json');

try {
    require_once("../config/database.php");
    require_once("../model/OrderModel.php");

    $db = new Database();
    $conn = $db->getConnection();

    if ($conn === false) {
        throw new Exception("Kết nối database thất bại: " . (new mysqli())->connect_error);
    }

    $orderID = isset($_GET['orderID']) ? (int)$_GET['orderID'] : null;
    if ($orderID === null) {
        throw new Exception("orderID không được cung cấp");
    }

    $order = OrderModel::getOrderById($conn, $orderID);
    if ($order) {
        echo json_encode(['success' => true, 'data' => $order]);
    } else {
        echo json_encode(['success' => true, 'data' => null, 'message' => 'Không tìm thấy đơn hàng']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>