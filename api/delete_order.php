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

    if (!$orderID) {
        throw new Exception("Mã đơn hàng không hợp lệ");
    }

    // Lấy thông tin đơn hàng trước khi xoá
    $order = OrderModel::getOrderById($conn, $orderID);
    if (!$order) {
        throw new Exception("Không tìm thấy đơn hàng với ID: " . $orderID);
    }
    $tableID = $order['tableID'] ?? null;

    $success = OrderModel::deleteOrder($conn, $orderID);

    if ($success) {
        if ($tableID) {
            // Cập nhật lại trạng thái bàn và orderID về 0
            $success = TableModel::updateTableStatus($conn, $tableID, 'off'); 
            if (!$success) {
                throw new Exception("Cập nhật trạng thái bàn thất bại");
            }
            $stmt = $conn->prepare("UPDATE tablecafe SET orderID = 0 WHERE tableID = ?");
            $stmt->bind_param("i", $tableID);
            $stmt->execute();
            $stmt->close();
        }
        echo json_encode(['success' => true]);
    } else {
        throw new Exception("Xoá đơn hàng thất bại");
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log("Lỗi khi xóa đơn hàng: " . $e->getMessage()); 
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>