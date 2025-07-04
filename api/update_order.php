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

    $input = json_decode(file_get_contents('php://input'), true);
    $orderID = $input['orderID'] ?? null;
    $orderDate = $input['orderDate'] ?? null;
    $totalPrice = $input['totalPrice'] ?? null;
    $status = $input['status'] ?? null;
    $tableID = $input['tableID'] ?? null;
    $items = $input['items'] ?? [];

    if (!$orderID || !$orderDate || !$totalPrice || !$status || !$tableID || empty($items)) {
        throw new Exception("Dữ liệu không đầy đủ");
    }

    $success = OrderModel::updateOrder($conn, $orderID, $orderDate, $totalPrice, $status, $tableID, $items);

    if ($success) {
        // Lấy previousTableID an toàn với prepared statement
        $stmt = $conn->prepare("SELECT tableID FROM orders WHERE orderID = ?");
        $stmt->bind_param("i", $orderID);
        $stmt->execute();
        $result = $stmt->get_result();
        $previousTableID = $result->fetch_assoc()['tableID'] ?? null;
        $stmt->close();

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