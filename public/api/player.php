<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
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
$playerKey = isset($_GET['key']) ? $_GET['key'] : null;

if (!$db) {
    http_response_code(500);
    echo json_encode(["error" => "Falha na conexão com o banco de dados."]);
    exit();
}

if ($method === 'GET' && $playerKey) {
    // 1. Get screen and assigned playlist
    $query = "SELECT s.id as screen_id, s.name as screen_name, s.assigned_playlist 
              FROM screens s 
              WHERE s.player_key = :player_key LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':player_key', $playerKey);
    $stmt->execute();
    $screen = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$screen) {
        http_response_code(404);
        echo json_encode(["error" => "Tela não encontrada."]);
        exit();
    }

    if (!$screen['assigned_playlist']) {
        echo json_encode([
            "screen" => $screen,
            "playlist" => null,
            "media" => []
        ]);
        exit();
    }

    // 2. Get playlist details
    $query = "SELECT * FROM playlists WHERE id = :playlist_id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':playlist_id', $screen['assigned_playlist']);
    $stmt->execute();
    $playlist = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$playlist) {
        echo json_encode([
            "screen" => $screen,
            "playlist" => null,
            "media" => []
        ]);
        exit();
    }

    // Parse items JSON
    $items = json_decode($playlist['items'], true);
    if (!$items) {
        $items = [];
    }

    // 3. Get media details
    $mediaIds = array_map(function($item) {
        return $item['mediaId'];
    }, $items);

    $mediaFiles = [];
    if (!empty($mediaIds)) {
        $placeholders = implode(',', array_fill(0, count($mediaIds), '?'));
        $query = "SELECT * FROM media WHERE id IN ($placeholders)";
        $stmt = $db->prepare($query);
        $stmt->execute($mediaIds);
        $mediaFiles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        "screen" => $screen,
        "playlist" => [
            "id" => $playlist['id'],
            "name" => $playlist['name'],
            "items" => $items
        ],
        "media" => $mediaFiles
    ]);

} elseif ($method === 'POST') {
    // Check if it's a heartbeat or notification
    $data = json_decode(file_get_contents("php://input"));
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    if ($action === 'heartbeat' && $playerKey) {
        $query = "UPDATE screens SET last_seen = NOW() WHERE player_key = :player_key";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':player_key', $playerKey);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Heartbeat received."]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Failed to update heartbeat."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Ação inválida ou chave ausente."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["error" => "Requisição inválida."]);
}
?>
