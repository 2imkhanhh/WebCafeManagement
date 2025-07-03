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

    $orderID = $_POST['orderID'] ?? null;
    $orderDate = $_POST['orderDate'] ?? null;
    $totalPrice = $_POST['totalPrice'] ?? null;
    $status = $_POST['status'] ?? null;
    $tableID = $_POST['tableID'] ?? null;
    $drinksID = $_POST['drinksID'] ?? null;
    $quantity = $_POST['quantity'] ?? 1; // Giá trị mặc định là 1 nếu không có

    if (!$orderID || !$orderDate || !$totalPrice || !$status || !$tableID || !$drinksID || !$quantity) {
        throw new Exception("Dữ liệu không đầy đủ");
    }

    $success = OrderModel::updateOrder($conn, $orderID, $orderDate, $totalPrice, $status, $tableID, $drinksID, $quantity);

    if ($success) {
        // Cập nhật trạng thái bàn nếu thay đổi tableID
        $previousTableID = $conn->query("SELECT tableID FROM orders WHERE orderID = $orderID")->fetch_assoc()['tableID'];
        if ($previousTableID != $tableID) {
            TableModel::updateTableStatus($conn, $previousTableID, 'off');
            TableModel::updateTableStatus($conn, $tableID, 'on');
        }
        echo json_encode(['success' => true, 'message' => 'Cập nhật đơn hàng thành công']);
    } else {
        throw new Exception("Cập nhật đơn hàng thất bại");
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>