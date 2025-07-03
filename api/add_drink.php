<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

try {
    if (!file_exists('../config/database.php') || !file_exists('../model/DrinkModel.php')) {
        throw new Exception("Không tìm thấy file database.php hoặc DrinkModel.php");
    }
    require_once("../config/database.php");
    require_once("../model/DrinkModel.php");

    $db = new Database();
    $conn = $db->getConnection();

    if ($conn === false) {
        throw new Exception("Kết nối database thất bại: " . (new mysqli())->connect_error);
    }

    $name = $_POST["tenMon"];
    $categoryName = isset($_POST["Category"]) ? trim($_POST["Category"]) : null; // Nhận tên category từ form
    $price = $_POST["gia"];
    $image = isset($_FILES['hinhAnh']) && $_FILES['hinhAnh']['error'] === UPLOAD_ERR_OK ? $_FILES['hinhAnh']['name'] : null;

    // Kiểm tra và lấy categoryID
    $categoryId = null;
    if ($categoryName && $categoryName !== "" && $categoryName !== "-- Chọn loại đồ uống --") {
        $categoryStmt = $conn->prepare("SELECT categoryID FROM category WHERE Name = ?");
        $categoryStmt->bind_param("s", $categoryName);
        $categoryStmt->execute();
        $result = $categoryStmt->get_result();
        $category = $result->fetch_assoc();
        if ($category) {
            $categoryId = $category['categoryID'];
        } else {
            throw new Exception("Loại đồ uống '$categoryName' không tồn tại trong bảng category");
        }
        $categoryStmt->close();
    } else {
        throw new Exception("Vui lòng chọn một loại đồ uống hợp lệ");
    }

    $imagePath = "";
    if ($image) {
        $uploadDir = "../uploads/";
        $targetFile = $uploadDir . basename($image);
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        if (move_uploaded_file($_FILES["hinhAnh"]["tmp_name"], $targetFile)) {
            $imagePath = $targetFile;
        } else {
            throw new Exception("Lỗi khi upload file: " . $_FILES["hinhAnh"]["error"]);
        }
    }

    $success = DrinkModel::addDrink($conn, $name, $categoryId, $price, $imagePath ?: null);

    echo json_encode([
        "success" => $success,
        "message" => $success ? "Thêm món thành công" : "Thêm món thất bại"
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>