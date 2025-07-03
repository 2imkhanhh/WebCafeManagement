<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Origin: *');
require_once '../model/StaffModel.php';

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (
    json_last_error() !== JSON_ERROR_NONE ||
    !isset($data['id'], $data['name'], $data['phone'], $data['role'], $data['salary'], $data['day_off'])
) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Dữ liệu không hợp lệ',
        'debug' => [
            'json_error' => json_last_error_msg(),
            'received' => $data
        ]
    ]);
    exit;
}

$staffModel = new StaffModel();
if ($staffModel->update($data['id'], $data)) {
    echo json_encode($staffModel->getById($data['id']));
} else {
    http_response_code(500);
    echo json_encode([
        'error' => 'Cập nhật nhân viên thất bại',
        'mysql_error' => $staffModel->getLastError()
    ]);
}
