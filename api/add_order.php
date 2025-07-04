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
        throw new Exception("Dữ liệu không đầy đủ: orderDate, totalPrice, status, tableID và items là bắt buộc");
    }

    $newOrderID = OrderModel::addOrder($conn, $orderDate, $totalPrice, $status, $tableID, $items);

    if (!$newOrderID || $newOrderID == 0) {
        throw new Exception("Không thể lấy ID tự động sau khi thêm đơn hàng: " . $conn->error);
    }

    $stmt = $conn->prepare("UPDATE tablecafe SET orderID = ? WHERE tableID = ?");
    $stmt->bind_param("ii", $newOrderID, $tableID);
    if (!$stmt->execute()) {
        throw new Exception("Cập nhật orderID cho tablecafe thất bại: " . $conn->error);
    }
    $stmt->close();

    TableModel::updateTableStatus($conn, $tableID, 'on');

    echo json_encode(['success' => true, 'message' => 'Thêm đơn hàng thành công', 'orderID' => $newOrderID]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
