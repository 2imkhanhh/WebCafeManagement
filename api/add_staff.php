<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Origin: *');

require_once '../model/StaffModel.php';

$input = file_get_contents('php://input');
$data = json_decode($input, true);
if (json_last_error() !== JSON_ERROR_NONE || !isset($data['name'], $data['phone'], $data['role'], $data['salary'], $data['day_off'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Dữ liệu JSON không hợp lệ hoặc thiếu trường: ' . json_last_error_msg()]);
    exit;
}

$staffModel = new StaffModel();
$stmt = $staffModel->conn->prepare("INSERT INTO staff (name, phone, role, salary, day_off) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssdi", $data['name'], $data['phone'], $data['role'], $data['salary'], $data['day_off']);
if ($stmt->execute()) {
    $id = $staffModel->conn->insert_id;
    $staff = $staffModel->getById($id);
    echo json_encode($staff);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Thêm thất bại: ' . $stmt->error]);
}
$stmt->close();
