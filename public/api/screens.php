<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connection.php';

$database = new DbConnection();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"));
$userId = isset($_GET['user_id']) ? $_GET['user_id'] : null; // Em produção, pegar do Token JWT

if (!$db) {
    http_response_code(500);
    echo json_encode(["error" => "Falha na conexão com o banco de dados."]);
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

// Rotas
switch ($method) {
    case 'GET':
        if ($userId) {
            $query = "SELECT * FROM screens WHERE created_by = :created_by ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':created_by', $userId);
            $stmt->execute();
            $screens = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["data" => $screens]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID do usuário necessário."]);
        }
        break;

    case 'POST':
        if (!empty($data->name) && !empty($data->created_by)) {
            $uuid = generate_uuid();
            $playerKey = bin2hex(random_bytes(8)); // 16 chars
            
            $query = "INSERT INTO screens (id, name, player_key, created_by) VALUES (:id, :name, :player_key, :created_by)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $uuid);
            $stmt->bindParam(':name', $data->name);
            $stmt->bindParam(':player_key', $playerKey);
            $stmt->bindParam(':created_by', $data->created_by);

            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(["message" => "Tela criada.", "id" => $uuid, "player_key" => $playerKey]);
            } else {
                http_response_code(503);
                echo json_encode(["error" => "Não foi possível criar a tela."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Dados incompletos."]);
        }
        break;
        
    case 'PUT':
        // Exemplo para atualizar playlist
        if (!empty($data->id) && isset($data->assigned_playlist)) {
            $query = "UPDATE screens SET assigned_playlist = :assigned_playlist WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':assigned_playlist', $data->assigned_playlist);
            $stmt->bindParam(':id', $data->id);
            
            if ($stmt->execute()) {
                echo json_encode(["message" => "Tela atualizada."]);
            } else {
                http_response_code(503);
                echo json_encode(["error" => "Erro ao atualizar."]);
            }
        }
        // Exemplo para atualizar notification_emails ou outros campos
        else if (!empty($data->id) && isset($data->notification_emails)) {
             // ... lógica similar
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if ($id) {
            $query = "DELETE FROM screens WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                echo json_encode(["message" => "Tela excluída."]);
            } else {
                http_response_code(503);
                echo json_encode(["error" => "Erro ao excluir."]);
            }
        } else {
             http_response_code(400);
             echo json_encode(["error" => "ID necessário."]);
        }
        break;
}
