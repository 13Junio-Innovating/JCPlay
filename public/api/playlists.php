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
$userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$id = isset($_GET['id']) ? $_GET['id'] : (isset($data->id) ? $data->id : null);

if (!$db) {
    http_response_code(500);
    echo json_encode(["error" => "Falha na conexão com o banco de dados."]);
    exit();
}

switch ($method) {
    case 'GET':
        if ($id) {
            $query = "SELECT * FROM playlists WHERE id = :id LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $playlist = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($playlist) {
                echo json_encode(["data" => $playlist]);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Playlist não encontrada."]);
            }
        } elseif ($userId) {
            $query = "SELECT * FROM playlists WHERE created_by = :created_by ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':created_by', $userId);
            $stmt->execute();
            $playlists = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["data" => $playlists]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID do usuário ou ID da playlist necessário."]);
        }
        break;

    case 'POST':
        if (!empty($data->name) && !empty($data->created_by)) {
            $query = "INSERT INTO playlists (name, description, items, created_by) VALUES (:name, :description, :items, :created_by)";
            $stmt = $db->prepare($query);
            
            $description = isset($data->description) ? $data->description : '';
            $items = isset($data->items) ? json_encode($data->items) : '[]';
            
            $stmt->bindParam(":name", $data->name);
            $stmt->bindParam(":description", $description);
            $stmt->bindParam(":items", $items);
            $stmt->bindParam(":created_by", $data->created_by);
            
            if ($stmt->execute()) {
                echo json_encode(["message" => "Playlist criada com sucesso."]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Erro ao criar playlist."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Dados incompletos."]);
        }
        break;

    case 'PUT':
        if (!empty($data->id)) {
            $updates = [];
            $params = [':id' => $data->id];
            
            if (isset($data->name)) {
                $updates[] = "name = :name";
                $params[':name'] = $data->name;
            }
            if (isset($data->description)) {
                $updates[] = "description = :description";
                $params[':description'] = $data->description;
            }
            if (isset($data->items)) {
                $updates[] = "items = :items";
                $params[':items'] = json_encode($data->items);
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(["error" => "Nenhum dado para atualizar."]);
                break;
            }
            
            $query = "UPDATE playlists SET " . implode(", ", $updates) . " WHERE id = :id";
            $stmt = $db->prepare($query);
            
            if ($stmt->execute($params)) {
                echo json_encode(["message" => "Playlist atualizada com sucesso."]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Erro ao atualizar playlist."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID da playlist necessário."]);
        }
        break;

    case 'DELETE':
        if ($id) {
            $query = "DELETE FROM playlists WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                echo json_encode(["message" => "Playlist excluída com sucesso."]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Erro ao excluir playlist."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID necessário."]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["error" => "Método não permitido."]);
        break;
}
?>
