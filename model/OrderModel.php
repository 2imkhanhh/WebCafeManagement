<?php
require_once("../config/database.php");

class OrderModel {
    public static function getAllOrders($conn) {
        $sql = "SELECT o.orderID, DATE(o.orderDate) AS orderDate, o.totalPrice, o.status, o.tableID, t.Name 
                FROM orders o 
                LEFT JOIN tablecafe t ON o.tableID = t.tableID";
        $result = $conn->query($sql);
        return $result;
    }

    public static function addOrder($conn, $orderDate, $totalPrice, $status, $tableID, $items) {
        $conn->begin_transaction();
        $sql = "INSERT INTO orders (orderDate, totalPrice, status, tableID) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sdsi", $orderDate, $totalPrice, $status, $tableID);
        $success = $stmt->execute();
        $stmt->close();

        if (!$success) {
            error_log("Lỗi khi thực thi INSERT INTO orders: " . $conn->error);
            $conn->rollback();
            return false;
        }

        $newOrderID = $conn->insert_id;
        error_log("Inserted orderID immediately after INSERT: " . $newOrderID); // Debug
        if ($newOrderID == 0) {
            error_log("Lỗi: insert_id là 0, kiểm tra LAST_INSERT_ID()");
            $stmt = $conn->prepare("SELECT LAST_INSERT_ID() as orderID");
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $newOrderID = $row['orderID'];
            $stmt->close();
            error_log("Retrieved orderID from LAST_INSERT_ID: " . $newOrderID);
            if ($newOrderID == 0) {
                error_log("Không thể lấy ID tự động: " . $conn->error);
                $conn->rollback();
                return false;
            }
        }

        if (empty($items)) {
            error_log("No items provided for orderID: " . $newOrderID);
            $conn->rollback();
            return false;
        }

        foreach ($items as $item) {
            $drinksID = $item['drinksID'];
            $quantity = $item['quantity'];
            $price = 0;
            $stmt = $conn->prepare("SELECT Price FROM drinks WHERE drinksID = ?");
            $stmt->bind_param("i", $drinksID);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                $price = $row['Price'] * $quantity;
            }
            $stmt->close();

            $stmt = $conn->prepare("INSERT INTO order_details (orderID, drinksID, quantity, price) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("iiid", $newOrderID, $drinksID, $quantity, $price);
            if (!$stmt->execute()) {
                error_log("Lỗi khi thêm order_details cho orderID " . $newOrderID . ": " . $conn->error);
                $conn->rollback();
                return false;
            }
            $stmt->close();
        }

        $conn->commit();
        error_log("Giao dịch commit thành công cho orderID: " . $newOrderID);
        self::updateTableStatus($conn, $tableID, 'on', $newOrderID);
        return $newOrderID;
    }

    public static function updateOrder($conn, $orderID, $orderDate, $totalPrice, $status, $tableID, $items) {
        $conn->begin_transaction();
        $sql = "UPDATE orders SET orderDate=?, totalPrice=?, status=?, tableID=? WHERE orderID=?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sdssi", $orderDate, $totalPrice, $status, $tableID, $orderID);
        $success = $stmt->execute();
        $stmt->close();

        if ($success) {
            $stmt = $conn->prepare("DELETE FROM order_details WHERE orderID = ?");
            $stmt->bind_param("i", $orderID);
            $stmt->execute();
            $stmt->close();

            foreach ($items as $item) {
                $drinksID = $item['drinksID'];
                $quantity = $item['quantity'];
                $price = 0;
                $stmt = $conn->prepare("SELECT Price FROM drinks WHERE drinksID = ?");
                $stmt->bind_param("i", $drinksID);
                $stmt->execute();
                $result = $stmt->get_result();
                if ($row = $result->fetch_assoc()) {
                    $price = $row['Price'] * $quantity;
                }
                $stmt->close();

                $stmt = $conn->prepare("INSERT INTO order_details (orderID, drinksID, quantity, price) VALUES (?, ?, ?, ?)");
                $stmt->bind_param("iiid", $orderID, $drinksID, $quantity, $price);
                if (!$stmt->execute()) {
                    $conn->rollback();
                    return false;
                }
                $stmt->close();
            }
            $conn->commit();
            // Cập nhật trạng thái bàn
            $oldOrder = self::getOrderById($conn, $orderID);
            if ($oldOrder && $oldOrder['tableID'] && $oldOrder['tableID'] != $tableID) {
                self::updateTableStatus($conn, $oldOrder['tableID'], 'off', 0);
            }
            self::updateTableStatus($conn, $tableID, 'on', $orderID);
            return true;
        }
        $conn->rollback();
        return false;
    }

    public static function getOrderById($conn, $orderID) {
        $sql = "SELECT o.orderID, DATE(o.orderDate) AS orderDate, o.totalPrice, o.status, o.tableID, t.Name 
                FROM orders o 
                LEFT JOIN tablecafe t ON o.tableID = t.tableID 
                WHERE o.orderID = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $orderID);
        $stmt->execute();
        $result = $stmt->get_result();
        $order = $result->fetch_assoc();
        $stmt->close();
        if ($order) {
            $order['details'] = self::getOrderDetails($conn, $orderID);
        }
        return $order ? $order : null;
    }

    public static function getOrderDetails($conn, $orderID) {
        $sql = "SELECT d.drinksID, d.Name, od.quantity, od.price 
                FROM order_details od 
                JOIN drinks d ON od.drinksID = d.drinksID 
                WHERE od.orderID = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $orderID);
        $stmt->execute();
        $result = $stmt->get_result();
        $details = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $details ? $details : [];
    }

    public static function deleteOrder($conn, $orderID) {
        $conn->begin_transaction();

        try {
            // Bước 1: Xóa các bản ghi trong invoices liên quan đến orderID
            $stmt = $conn->prepare("DELETE FROM invoices WHERE orderID = ?");
            $stmt->bind_param("i", $orderID);
            if (!$stmt->execute()) {
                throw new Exception("Lỗi xóa invoices: " . $conn->error);
            }
            $stmt->close();

            // Bước 2: Xóa các bản ghi trong order_details liên quan đến orderID
            $stmt = $conn->prepare("DELETE FROM order_details WHERE orderID = ?");
            $stmt->bind_param("i", $orderID);
            if (!$stmt->execute()) {
                throw new Exception("Lỗi xóa order_details: " . $conn->error);
            }
            $stmt->close();

            // Bước 3: Xóa bản ghi trong orders
            $sql = "DELETE FROM orders WHERE orderID = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $orderID);
            $success = $stmt->execute();
            $stmt->close();

            if ($success) {
                $conn->commit();
                return true;
            } else {
                $conn->rollback();
                return false;
            }
        } catch (Exception $e) {
            $conn->rollback();
            error_log("Lỗi trong deleteOrder: " . $e->getMessage());
            return false;
        }
    }

    public static function updateTableStatus($conn, $tableID, $status, $orderID) {
        $sql = "UPDATE tablecafe SET Status = ?, orderID = ? WHERE tableID = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sii", $status, $orderID, $tableID);
        $success = $stmt->execute();
        $stmt->close();
        return $success;
    }
}
?>