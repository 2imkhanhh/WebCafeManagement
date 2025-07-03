<?php
require_once("../config/database.php");

class OrderModel {
    public static function getAllOrders($conn) {
        $sql = "SELECT orderID, DATE(orderDate) AS orderDate, totalPrice, status, tableID, drinksID, quantity FROM orders";
        return $conn->query($sql);
    }

    public static function addOrder($conn, $orderDate, $totalPrice, $status, $tableID, $drinksID, $quantity) {
        $sql = "INSERT INTO orders (orderDate, totalPrice, status, tableID, drinksID, quantity) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sisiii", $orderDate, $totalPrice, $status, $tableID, $drinksID, $quantity);
        return $stmt->execute();
    }

    public static function updateOrder($conn, $orderID, $orderDate, $totalPrice, $status, $tableID, $drinksID, $quantity) {
        $sql = "UPDATE orders SET orderDate=?, totalPrice=?, status=?, tableID=?, drinksID=?, quantity=? WHERE orderID=?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sdsiisi", $orderDate, $totalPrice, $status, $tableID, $drinksID, $quantity, $orderID);
        return $stmt->execute();
    }

    public static function getOrderById($conn, $orderID) {
        $sql = "SELECT orderID, DATE(orderDate) AS orderDate, totalPrice, status, tableID, drinksID, quantity FROM orders WHERE orderID = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $orderID);
        $stmt->execute();
        $result = $stmt->get_result();
        $order = $result->fetch_assoc();
        $stmt->close();
        return $order ? $order : null;
    }
}