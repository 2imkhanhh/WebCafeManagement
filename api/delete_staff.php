<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE');

require_once '../model/StaffModel.php';

if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Thiếu ID nhân viên']);
    exit;
}

$staffModel = new StaffModel();
$id = intval($_GET['id']);

try {
    $stmt = $staffModel->conn->prepare("DELETE FROM staff WHERE id = ?");
    if (!$stmt) {
        throw new Exception("Lỗi prepare: " . $staffModel->conn->error);
    }
    $stmt->bind_param("i", $id);
    if (!$stmt->execute()) {
        throw new Exception("Lỗi execute: " . $stmt->error);
    }

    echo json_encode(['success' => true]);
    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
