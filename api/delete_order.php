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

    $orderID = $_POST['orderID'] ?? null;

    if (!$orderID) {
        throw new Exception("Mã đơn hàng không hợp lệ");
    }

    // Lấy thông tin bàn trước khi xóa
    $stmt = $conn->prepare("SELECT tableID FROM orders WHERE orderID = ?");
    $stmt->bind_param("i", $orderID);
    $stmt->execute();
    $result = $stmt->get_result();
    $order = $result->fetch_assoc();
    $stmt->close();

    $success = OrderModel::deleteOrder($conn, $orderID);

    if ($success) {
        if ($order && $order['tableID']) {
            require_once("../model/TableModel.php");
            TableModel::updateTableStatus($conn, $order['tableID'], 'off');
        }
        echo json_encode(['success' => true]);
    } else {
        throw new Exception("Xóa thất bại: " . $conn->error);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>