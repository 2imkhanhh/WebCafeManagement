<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

try {
    require_once("../config/database.php");
    require_once("../model/DrinkModel.php");

    $db = new Database();
    $conn = $db->getConnection();

    $id = $_POST["ID"];
    $name = $_POST["Name"];
    $categoryName = isset($_POST["Category"]) ? trim($_POST["Category"]) : null; // Nhận tên category
    $price = $_POST["Price"];
    $image = isset($_FILES['Image']) && $_FILES['Image']['error'] === UPLOAD_ERR_OK ? $_FILES['Image']['name'] : null;

    // Lấy categoryID từ tên category
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
        if (move_uploaded_file($_FILES["Image"]["tmp_name"], $targetFile)) {
            $imagePath = $targetFile;
        } else {
            throw new Exception("Lỗi khi upload file: " . $_FILES["Image"]["error"]);
        }
    } else {
        $imagePath = $_POST["OldImage"]; // Giữ hình ảnh cũ nếu không thay đổi
    }

    $success = DrinkModel::updateDrink($conn, $id, $name, $categoryId, $price, $imagePath);

    echo json_encode([
        "success" => $success,
        "message" => $success ? "Cập nhật thành công" : "Cập nhật thất bại"
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>