<?php  
require_once __DIR__ . '/../config/database.php';
class CategoryModel {
    
    private $conn;
    public function __construct(){
        $this->conn = (new Database)->getConnection();
    }

    public function getAll() {
        $sql = "SELECT * FROM category";
        $result = $this->conn->query($sql);
        return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    }

    public function getByID($id) {
        $sql = "SELECT * FROM category WHERE categoryID = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    public function AddCategory($name) {
        $sql = "INSERT INTO category (name) VALUES (?)";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("s", $name);
        return $stmt->execute();
    }

    public function UpdateCategory($id, $name) {
        $sql = "UPDATE category SET name = ? WHERE categoryID = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("si", $name, $id);
        return $stmt->execute();
    }

    public function DeleteCategory($id) {
        $sql = "DELETE FROM category WHERE categoryID = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }
}
?>
