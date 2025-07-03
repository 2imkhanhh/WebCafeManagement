<?php
header('Content-Type: application/json');

try {
    require_once("../config/database.php");

    $db = new Database();
    $conn = $db->getConnection();

    if ($conn === false) {
        throw new Exception("Kết nối database thất bại: " . (new mysqli())->connect_error);
    }

    $orderID = $_POST['orderID'] ?? null;

    if (!$orderID) {
        throw new Exception("Mã đơn hàng không hợp lệ");
    }

    $sql = "DELETE FROM orders WHERE orderID = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $orderID);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        throw new Exception("Xóa thất bại: " . $conn->error);
    }

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>