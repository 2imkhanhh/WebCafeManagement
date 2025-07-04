<?php
header('Content-Type: application/json');

try {
    require_once('../config/database.php');
    require_once('../model/InvoiceModel.php');
    require_once('../model/TableModel.php');

    $db = new Database();
    $conn = $db->getConnection();

    $orderID = isset($_POST['orderID']) ? (int)$_POST['orderID'] : null;
    $total = isset($_POST['total']) ? (float)$_POST['total'] : null;
    $tableID = isset($_POST['tableID']) ? (int)$_POST['tableID'] : null;

    if (!$orderID || !$total || !$tableID) {
        echo json_encode(['success' => false, 'message' => 'Thiếu dữ liệu']);
        exit;
    }

    $success = InvoiceModel::createInvoice($conn, $orderID, $tableID, $total);

    if ($success) {
        // Cập nhật trạng thái bàn về off
        TableModel::clearTableAfterPayment($conn, $tableID);

        echo json_encode([
            'success' => true,
            'message' => 'Tạo hóa đơn thành công'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Tạo hóa đơn thất bại'
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
