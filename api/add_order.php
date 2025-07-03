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
    $orderDate = $input['orderDate'] ?? null;
    $totalPrice = $input['totalPrice'] ?? null;
    $status = $input['status'] ?? null;
    $tableID = $input['tableID'] ?? null;
    $items = $input['items'] ?? [];

    if (!$orderDate || !$totalPrice || !$status || !$tableID || empty($items)) {
        throw new Exception("Dữ liệu không đầy đủ");
    }

    $success = OrderModel::addOrder($conn, $orderDate, $totalPrice, $status, $tableID, $items);

    if ($success) {
        $newOrderID = $conn->insert_id;
        $stmt = $conn->prepare("UPDATE tablecafe SET orderID = ? WHERE tableID = ?");
        $stmt->bind_param("ii", $newOrderID, $tableID);
        $stmt->execute();
        $stmt->close();

        TableModel::updateTableStatus($conn, $tableID, 'on');
        echo json_encode(['success' => true, 'message' => 'Thêm đơn hàng thành công', 'orderID' => $newOrderID]);
    } else {
        throw new Exception("Thêm đơn hàng thất bại");
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>