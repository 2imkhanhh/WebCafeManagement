<?php
class StaffModel {
    public $conn;

    public function __construct() {
        $this->conn = new mysqli("localhost", "root", "", "webcafemanagement");
        if ($this->conn->connect_error) {
            $error = "Kết nối thất bại: " . $this->conn->connect_error;
            error_log($error);
            die(json_encode(['error' => $error]));
        }
        $this->conn->set_charset("utf8mb4");
    }

    public function getAll() {
        $result = $this->conn->query("SELECT * FROM staff");
        return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    }

    public function getById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM staff WHERE id = ?");
        if ($stmt === false) {
            error_log("Lỗi prepare getById: " . $this->conn->error);
            return null;
        }
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_assoc();
        $stmt->close();
        return $data;
    }

    public function update($id, $data) {
    $stmt = $this->conn->prepare("UPDATE staff SET name = ?, phone = ?, role = ?, salary = ?, day_off = ? WHERE id = ?");
    if ($stmt === false) {
        error_log("Lỗi prepare update: " . $this->conn->error);
        return false;
    }
    $stmt->bind_param("sssdis", $data['name'], $data['phone'], $data['role'], $data['salary'], $data['day_off'], $id);
    $result = $stmt->execute();
    $stmt->close();
    return $result;
}


    public function getLastError() {
        return $this->conn ? $this->conn->error : 'Không có kết nối';
    }

    public function __destruct() {
        if ($this->conn) {
            $this->conn->close();
        }
    }
}
?>