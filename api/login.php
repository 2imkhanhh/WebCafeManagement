<?php
require_once('../config/database.php');
require_once('../model/AccountModel.php');

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"));

if (isset($data->email) && isset($data->password)) {
    $email = $data->email;
    $password = $data->password;

    $model = new AccountModel();
    $user = $model->checkLogin($email, $password);

    if ($user) {
        echo json_encode(["success" => true, "user" => $user]);
    } else {
        echo json_encode(["success" => false, "message" => "Sai email hoặc mật khẩu"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Thiếu thông tin"]);
}
