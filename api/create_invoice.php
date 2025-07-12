<?php
header('Content-Type: application/json');

try {
    require_once('../config/database.php');
    require_once('../model/InvoiceModel.php');
    require_once('../model/TableModel.php');
    require_once('../model/OrderModel.php'); 

    $db = new Database();
    $conn = $db->getConnection();

    $orderID = isset($_POST['orderID']) ? (int)$_POST['orderID'] : null;
    $total = isset($_POST['total']) ? (float)$_POST['total'] : null;
    $tableID = isset($_POST['tableID']) ? (int)$_POST['tableID'] : null;

    if (!$orderID || !$total || !$tableID) {
        echo json_encode(['success' => false, 'message' => 'Thiếu dữ liệu']);
        exit;
    }

    $conn->begin_transaction();

    $success = InvoiceModel::createInvoice($conn, $orderID, $tableID, $total);

    if ($success) {
        // Cập nhật trạng thái đơn hàng thành 'paid'
        $stmt = $conn->prepare("UPDATE orders SET status = 'paid' WHERE orderID = ?");
        if ($stmt === false) {
            throw new Exception("Lỗi chuẩn bị truy vấn cập nhật trạng thái: " . $conn->error);
        }
        $stmt->bind_param("i", $orderID);
        if (!$stmt->execute()) {
            throw new Exception("Cập nhật trạng thái thanh toán thất bại: " . $conn->error);
        }
        $stmt->close();

        // Cập nhật trạng thái bàn về off
        TableModel::clearTableAfterPayment($conn, $tableID);

        $conn->commit(); 

        echo json_encode([
            'success' => true,
            'message' => 'Tạo hóa đơn và thanh toán thành công'
        ]);
    } else {
        $conn->rollback(); 
        echo json_encode([
            'success' => false,
            'message' => 'Tạo hóa đơn thất bại'
        ]);
    }
} catch (Exception $e) {
    $conn->rollback(); 
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>