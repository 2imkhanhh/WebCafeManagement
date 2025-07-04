<?php
header('Content-Type: application/json');

try {
    require_once("../config/database.php");

    $db = new Database();
    $conn = $db->getConnection();

    if ($conn === false) {
        throw new Exception("Kết nối database thất bại: " . (new mysqli())->connect_error);
    }

    $tableID = $_POST['tableID'] ?? null;
    $status = $_POST['status'] ?? null;
    $orderID = $_POST['orderID'] ?? null;

    if (!$tableID || !$status) {
        throw new Exception("Thiếu thông tin bàn hoặc trạng thái");
    }

    $sql = "UPDATE tablecafe SET Status = ?, orderID = ? WHERE tableID = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sii", $status, $orderID, $tableID);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        throw new Exception("Cập nhật trạng thái bàn thất bại: " . $conn->error);
    }

    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>