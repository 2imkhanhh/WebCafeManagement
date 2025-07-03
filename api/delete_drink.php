<?php
require_once("../config/database.php");
require_once("../model/DrinkModel.php");

$response = ['success' => false];

if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['id'])) {
    $database = new Database();
    $conn = $database->getConnection();

    $id = $_GET['id'];

    // Gọi phương thức xóa trong DrinkModel
    $success = DrinkModel::deleteDrink($conn, $id);

    if ($success) {
        $response['success'] = true;
        $response['message'] = 'Xóa món thành công.';
    } else {
        $response['message'] = 'Xóa món thất bại.';
    }
} else {
    $response['message'] = 'Yêu cầu không hợp lệ.';
}

header('Content-Type: application/json');
echo json_encode($response);
?>