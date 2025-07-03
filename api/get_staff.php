<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

  header('Content-Type: application/json');
  header('Access-Control-Allow-Methods: GET');
  header('Access-Control-Allow-Origin: *');

  require_once '../model/StaffModel.php';

  try {
      $staffModel = new StaffModel();
      if (isset($_GET['id'])) {
          $staff = $staffModel->getById($_GET['id']);
          echo json_encode($staff ? $staff : ['error' => 'Nhân viên không tìm thấy']);
      } else {
          $staffs = $staffModel->getAll();
          echo json_encode($staffs);
      }
  } catch (Exception $e) {
      http_response_code(500);
      echo json_encode(['error' => 'Lỗi server: ' . $e->getMessage()]);
  }
  ?>