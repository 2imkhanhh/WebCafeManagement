<?php
require_once("../config/database.php");

class DrinkModel {
    public static function getAllDrinks($conn) {
        $sql = "SELECT * FROM drinks";
        return $conn->query($sql);
    }

    public static function addDrink($conn, $name, $categoryId, $price, $imagePath) {
        $stmt = $conn->prepare("INSERT INTO drinks (Name, categoryID, Price, Image) VALUES (?, ?, ?, ?)");
        if ($stmt === false) {
            throw new Exception("Lỗi chuẩn bị truy vấn: " . $conn->error);
        }

        $stmt->bind_param("siss", $name, $categoryId, $price, $imagePath);

        $success = $stmt->execute();
        $stmt->close();

        return $success;
    }

    public static function updateDrink($conn, $id, $name, $categoryId, $price, $imagePath) {
        $stmt = $conn->prepare("UPDATE drinks SET Name = ?, categoryID = ?, Price = ?, Image = ? WHERE drinksID = ?");
        if ($stmt === false) {
            throw new Exception("Lỗi chuẩn bị truy vấn: " . $conn->error);
        }

        $stmt->bind_param("sissi", $name, $categoryId, $price, $imagePath, $id);

        $success = $stmt->execute();
        $stmt->close();

        return $success;
    }

    public static function deleteDrink($conn, $id) {
        $sql = "DELETE FROM drinks WHERE drinksID = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }

    public static function getCategories($conn) {
        $sql = "SELECT categoryID,  Name FROM category";
        $result = $conn->query($sql);
        return $result->fetch_all(MYSQLI_ASSOC);
    }
}