<?php
header('Content-Type: application/json');

try {
    require_once("../config/database.php");
    require_once("../model/OrderModel.php");
    require_once("../model/TableModel.php");

    $db = new Database();
    $conn = $db->getConnection();

    if ($conn === false) {
        throw new Exception("Kết nối database thất bại: " . (new mysqli())->connect_error);
    }

    $orderDate = $_POST['orderDate'] ?? null;
    $totalPrice = $_POST['totalPrice'] ?? null;
    $status = $_POST['status'] ?? null;
    $tableID = $_POST['tableID'] ?? null;
    $drinksID = $_POST['drinksID'] ?? null;
    $quantity = $_POST['quantity'] ?? 1; // Giá trị mặc định là 1 nếu không có

    if (!$orderDate || !$totalPrice || !$status || !$tableID || !$drinksID || !$quantity) {
        throw new Exception("Dữ liệu không đầy đủ");
    }

    $success = OrderModel::addOrder($conn, $orderDate, $totalPrice, $status, $tableID, $drinksID, $quantity);

    if ($success) {
        // Cập nhật trạng thái bàn thành "on"
        TableModel::updateTableStatus($conn, $tableID, 'on');
        echo json_encode(['success' => true, 'message' => 'Thêm đơn hàng thành công', 'orderID' => $conn->insert_id]);
    } else {
        throw new Exception("Thêm đơn hàng thất bại");
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>