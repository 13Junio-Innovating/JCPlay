<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connection.php';

$database = new DbConnection();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$db) {
    http_response_code(500);
    exit();
}

function generate_uuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $type = isset($_GET['type']) ? $_GET['type'] : 'activity';

    if ($type === 'activity') {
        $query = "INSERT INTO user_activity_logs (id, user_id, action, resource, resource_id, details) VALUES (:id, :user_id, :action, :resource, :resource_id, :details)";
        $stmt = $db->prepare($query);
        $uuid = generate_uuid();
        $details = isset($data->details) ? json_encode($data->details) : null;
        
        $stmt->bindParam(':id', $uuid);
        $stmt->bindParam(':user_id', $data->user_id);
        $stmt->bindParam(':action', $data->action);
        $stmt->bindParam(':resource', $data->resource);
        $stmt->bindParam(':resource_id', $data->resource_id);
        $stmt->bindParam(':details', $details);
        
        $stmt->execute();
    } elseif ($type === 'error') {
        $query = "INSERT INTO error_logs (id, user_id, error_type, error_message, severity, context) VALUES (:id, :user_id, :error_type, :error_message, :severity, :context)";
        $stmt = $db->prepare($query);
        $uuid = generate_uuid();
        $context = isset($data->context) ? json_encode($data->context) : null;
        
        $stmt->bindParam(':id', $uuid);
        $stmt->bindParam(':user_id', $data->user_id);
        $stmt->bindParam(':error_type', $data->error_type);
        $stmt->bindParam(':error_message', $data->error_message);
        $stmt->bindParam(':severity', $data->severity);
        $stmt->bindParam(':context', $context);
        
        $stmt->execute();
    }
    
    http_response_code(201);
    echo json_encode(["message" => "Log saved"]);

} elseif ($method === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    $type = isset($_GET['type']) ? $_GET['type'] : '';
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

    if ($action === 'stats') {
        $stats = [
            "user_activities_today" => 0,
            "user_activities_week" => 0,
            "errors_today" => 0,
            "errors_week" => 0,
            "unresolved_errors" => 0
        ];

        try {
            $query = "SELECT COUNT(*) FROM user_activity_logs WHERE created_at >= CURDATE()";
            $stats['user_activities_today'] = $db->query($query)->fetchColumn();

            $query = "SELECT COUNT(*) FROM user_activity_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            $stats['user_activities_week'] = $db->query($query)->fetchColumn();

            $query = "SELECT COUNT(*) FROM error_logs WHERE created_at >= CURDATE()";
            $stats['errors_today'] = $db->query($query)->fetchColumn();

            $query = "SELECT COUNT(*) FROM error_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            $stats['errors_week'] = $db->query($query)->fetchColumn();

            $query = "SELECT COUNT(*) FROM error_logs WHERE resolved = 0";
            $stats['unresolved_errors'] = $db->query($query)->fetchColumn();
        } catch (Exception $e) {
            // Silently fail or log error if tables don't exist yet
        }

        echo json_encode($stats);
    } elseif ($type === 'activity') {
        try {
            $query = "SELECT * FROM user_activity_logs ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($data as &$row) {
                $row['details'] = json_decode($row['details']);
            }
            
            echo json_encode(["data" => $data]);
        } catch (Exception $e) {
             echo json_encode(["data" => []]);
        }
    } elseif ($type === 'error') {
        try {
            $query = "SELECT * FROM error_logs ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($data as &$row) {
                $row['context'] = json_decode($row['context']);
            }
            
            echo json_encode(["data" => $data]);
        } catch (Exception $e) {
            echo json_encode(["data" => []]);
        }
    }

} elseif ($method === 'PUT') {
    if (isset($data->id) && isset($data->resolved)) {
        try {
            $query = "UPDATE error_logs SET resolved = :resolved WHERE id = :id";
            $stmt = $db->prepare($query);
            $resolved = $data->resolved ? 1 : 0;
            $stmt->bindParam(':resolved', $resolved, PDO::PARAM_INT);
            $stmt->bindParam(':id', $data->id);
            if ($stmt->execute()) {
                echo json_encode(["message" => "Updated"]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Failed to update"]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error updating log"]);
        }
    }
}
