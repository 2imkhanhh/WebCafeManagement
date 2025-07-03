<?php
header('Content-Type: application/json');
require_once '../model/CategoryModel.php';
$model = new CategoryModel();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $data = $model->getByID((int)$_GET['id']);
        echo json_encode(['success' => true, 'data' => $data]);
    } else {
        $data = $model->getAll();
        echo json_encode(['success' => true, 'data' => $data]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['id']) && $input['id']) {
        $result = $model->UpdateCategory((int)$input['id'], $input['name']);
    } else {
        $result = $model->AddCategory($input['name']);
    }
    echo json_encode(['success' => $result]);
} elseif ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $result = $model->DeleteCategory((int)$input['id']);
    echo json_encode(['success' => $result]);
} else {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
