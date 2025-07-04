<?php
header('Content-Type: application/json');

try {
    require_once('../config/database.php');
    require_once('../model/InvoiceModel.php');

    $db = new Database();
    $conn = $db->getConnection();

    $data = InvoiceModel::getAllInvoices($conn);

    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
