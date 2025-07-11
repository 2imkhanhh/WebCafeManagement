<?php
require_once '../config/database.php';  // file kết nối DB

class StatisticsModel {
  private $conn;

  public function __construct($db) {
    $this->conn = $db;
  }

  public function getRevenueByMonth($year, $month) {
    $sql = "SELECT DAY(paymentDate) AS day, SUM(totalPrice) AS total
            FROM invoices
            WHERE YEAR(paymentDate) = ? AND MONTH(paymentDate) = ?
            GROUP BY day
            ORDER BY day";
    $stmt = $this->conn->prepare($sql);
    $stmt->bind_param("ii", $year, $month);
    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
      $data[] = $row;
    }
    return $data;
  }
}
?>
