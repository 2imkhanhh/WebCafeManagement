<?php
header('Content-Type: application/json');

try {
    require_once("../config/database.php");
    require_once("../model/TableModel.php");

    $db = new Database();
    $conn = $db->getConnection();

    if ($conn === false) {
        throw new Exception("Kết nối database thất bại: " . (new mysqli())->connect_error);
    }

    $sql = "SELECT tableID, Name, Status, orderID FROM tablecafe";
    $result = $conn->query($sql);

    if ($result === false) {
        throw new Exception("Lỗi truy vấn: " . $conn->error);
    }

    $tables = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode(['success' => true, 'data' => $tables]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>