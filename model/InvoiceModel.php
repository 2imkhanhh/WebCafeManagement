<?php
class InvoiceModel {
    public static function createInvoice($conn, $orderID, $tableID, $total) {
        $stmt = $conn->prepare("INSERT INTO invoices (orderID, tableID, totalPrice) VALUES (?, ?, ?)");
        $stmt->bind_param("iid", $orderID, $tableID, $total);
        return $stmt->execute();
    }

    public static function getAllInvoices($conn) {
        $sql = "SELECT i.invoiceID, i.orderID, i.totalPrice, o.orderDate
                FROM invoices i
                JOIN orders o ON i.orderID = o.orderID
                ORDER BY o.orderDate DESC";

        $result = $conn->query($sql);
        $invoices = [];
        while ($row = $result->fetch_assoc()) {
            $invoices[] = $row;
        }
    return $invoices;
}


    public static function getInvoiceDetails($conn, $invoiceID) {
        $stmt = $conn->prepare("
            SELECT i.*, o.orderDate, d.Name, d.price, od.quantity
            FROM invoices i
            JOIN orders o ON i.orderID = o.orderID
            JOIN order_details od ON o.orderID = od.orderID
            JOIN drinks d ON od.drinkID = d.drinkID
            WHERE i.invoiceID = ?
        ");
        $stmt->bind_param("i", $invoiceID);
        $stmt->execute();
        $result = $stmt->get_result();
        $details = [];
        while ($row = $result->fetch_assoc()) {
            $details[] = $row;
        }
        return $details;
    }
}
