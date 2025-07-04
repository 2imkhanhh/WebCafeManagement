<?php
class TableModel {
    public static function addTable($conn, $name, $status, $orderID = null) {
        $stmt = $conn->prepare("INSERT INTO tablecafe (Name, Status, orderID) VALUES (?, ?, ?)");
        if ($stmt === false) {
            throw new Exception("Lỗi chuẩn bị truy vấn: " . $conn->error);
        }

        $stmt->bind_param("ssi", $name, $status, $orderID);

        $success = $stmt->execute();
        $stmt->close();

        return $success;
    }

    public static function updateTable($conn, $id, $name, $status, $orderID = null) {
        $stmt = $conn->prepare("UPDATE tablecafe SET Name = ?, Status = ?, orderID = ? WHERE tableID = ?");
        if ($stmt === false) {
            throw new Exception("Lỗi chuẩn bị truy vấn: " . $conn->error);
        }

        $stmt->bind_param("ssii", $name, $status, $orderID, $id);

        $success = $stmt->execute();
        $stmt->close();

        return $success;
    }

    public static function deleteTable($conn, $id) {
        $stmt = $conn->prepare("DELETE FROM tablecafe WHERE tableID = ?");
        if ($stmt === false) {
            throw new Exception("Lỗi chuẩn bị truy vấn: " . $conn->error);
        }

        $stmt->bind_param("i", $id);

        $success = $stmt->execute();
        $stmt->close();

        return $success;
    }

    public static function updateTableStatus($conn, $id, $status) {
        $stmt = $conn->prepare("UPDATE tablecafe SET Status = ? WHERE tableID = ?");
        if ($stmt === false) {
            throw new Exception("Lỗi chuẩn bị truy vấn: " . $conn->error);
        }

        $stmt->bind_param("si", $status, $id);

        $success = $stmt->execute();
        $stmt->close();

        return $success;
    }

    public static function clearTableAfterPayment($conn, $tableID) {
        $stmt = $conn->prepare("UPDATE tablecafe SET Status = 'off', orderID = NULL WHERE tableID = ?");
        if ($stmt === false) {
            throw new Exception("Lỗi chuẩn bị truy vấn: " . $conn->error);
        }

        $stmt->bind_param("i", $tableID);

        $success = $stmt->execute();
        $stmt->close();

        return $success;
    }
}
?>
