<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS");
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
$userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$db) {
    http_response_code(500);
    echo json_encode(["error" => "Falha na conexão com o banco de dados."]);
    exit();
}

switch ($method) {
    case 'GET':
        $ids = isset($_GET['ids']) ? $_GET['ids'] : null;
        
        if ($ids) {
            $idList = explode(',', $ids);
            // Ensure IDs are safe (assuming they are integers for auto-increment, or strings if UUID)
            // Using prepared statements with IN clause is tricky with PDO.
            // Construct string of ? placeholders
            $placeholders = str_repeat('?,', count($idList) - 1) . '?';
            $query = "SELECT * FROM media WHERE id IN ($placeholders)";
            $stmt = $db->prepare($query);
            
            if ($stmt->execute($idList)) {
                $media = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(["data" => $media, "count" => count($media)]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Erro ao buscar mídias por IDs."]);
            }
        } elseif ($userId) {
            $query = "SELECT * FROM media WHERE uploaded_by = :uploaded_by ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':uploaded_by', $userId);
            
            if ($stmt->execute()) {
                $media = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(["data" => $media, "count" => count($media)]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Erro ao buscar mídias."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID do usuário ou lista de IDs necessária."]);
        }
        break;

    case 'POST':
        if (isset($_FILES['file'])) {
            // File Upload
            $uploadedBy = isset($_POST['uploaded_by']) ? $_POST['uploaded_by'] : null;
            $duration = isset($_POST['duration']) ? $_POST['duration'] : 10;
            $type = isset($_POST['type']) ? $_POST['type'] : 'image'; 
            
            if (!$uploadedBy) {
                http_response_code(400);
                echo json_encode(["error" => "ID do usuário necessário."]);
                exit();
            }

            $targetDir = "../uploads/";
            if (!file_exists($targetDir)) {
                mkdir($targetDir, 0777, true);
            }
            
            $fileName = basename($_FILES["file"]["name"]);
            // Generate unique name to avoid collisions
            $uniqueName = uniqid() . "_" . $fileName;
            $targetFilePath = $targetDir . $uniqueName;
            
            if (move_uploaded_file($_FILES["file"]["tmp_name"], $targetFilePath)) {
                $fileUrl = "/uploads/" . $uniqueName;
                
                $query = "INSERT INTO media (name, url, type, duration, uploaded_by) VALUES (:name, :url, :type, :duration, :uploaded_by)";
                $stmt = $db->prepare($query);
                
                $stmt->bindParam(":name", $fileName);
                $stmt->bindParam(":url", $fileUrl);
                $stmt->bindParam(":type", $type);
                $stmt->bindParam(":duration", $duration);
                $stmt->bindParam(":uploaded_by", $uploadedBy);
                
                if ($stmt->execute()) {
                    $lastId = $db->lastInsertId();
                    echo json_encode(["message" => "Arquivo enviado com sucesso.", "url" => $fileUrl, "id" => $lastId]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Erro ao salvar no banco de dados."]);
                }
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Erro ao fazer upload do arquivo."]);
            }

        } else {
            // JSON Body (Link)
            $data = json_decode(file_get_contents("php://input"));
            
            if (!empty($data->name) && !empty($data->url) && !empty($data->uploaded_by)) {
                $query = "INSERT INTO media (name, url, type, duration, uploaded_by) VALUES (:name, :url, :type, :duration, :uploaded_by)";
                $stmt = $db->prepare($query);
                
                $type = isset($data->type) ? $data->type : 'video'; 
                
                $stmt->bindParam(":name", $data->name);
                $stmt->bindParam(":url", $data->url);
                $stmt->bindParam(":type", $type);
                $stmt->bindParam(":duration", $data->duration);
                $stmt->bindParam(":uploaded_by", $data->uploaded_by);
                
                if ($stmt->execute()) {
                    $lastId = $db->lastInsertId();
                    echo json_encode(["message" => "Link adicionado com sucesso.", "id" => $lastId]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Erro ao adicionar link."]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Dados incompletos."]);
            }
        }
        break;
        
    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"));
        $id = isset($_GET['id']) ? $_GET['id'] : (isset($data->id) ? $data->id : null);
        
        if ($id) {
            $query = "SELECT url FROM media WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($row) {
                if (strpos($row['url'], '/uploads/') === 0) {
                    $filePath = ".." . $row['url'];
                    if (file_exists($filePath)) {
                        unlink($filePath);
                    }
                }
                
                $query = "DELETE FROM media WHERE id = :id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $id);
                
                if ($stmt->execute()) {
                    echo json_encode(["message" => "Mídia excluída com sucesso."]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Erro ao excluir mídia."]);
                }
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Mídia não encontrada."]);
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
