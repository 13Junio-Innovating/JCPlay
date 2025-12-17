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

$data = json_decode(file_get_contents("php://input"));
$action = isset($_GET['action']) ? $_GET['action'] : '';

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

switch ($action) {
    case 'register':
        if (!empty($data->email) && !empty($data->password)) {
            $email = $data->email;
            $password = password_hash($data->password, PASSWORD_BCRYPT);
            $fullName = isset($data->full_name) ? $data->full_name : '';
            $uuid = generate_uuid();

            // Verificar se email já existe
            $checkQuery = "SELECT id FROM users WHERE email = :email LIMIT 1";
            $stmt = $db->prepare($checkQuery);
            $stmt->bindParam(':email', $email);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                http_response_code(400);
                echo json_encode(["error" => "Email já cadastrado."]);
                break;
            }

            try {
                // Inserir usuário
                $query = "INSERT INTO users (id, email, password, full_name) VALUES (:id, :email, :password, :full_name)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $uuid);
                $stmt->bindParam(':email', $email);
                $stmt->bindParam(':password', $password);
                $stmt->bindParam(':full_name', $fullName);
                $stmt->execute();

                http_response_code(201);
                echo json_encode(["message" => "Usuário criado com sucesso.", "user" => ["id" => $uuid, "email" => $email, "full_name" => $fullName]]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(["error" => "Erro ao criar usuário: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Dados incompletos."]);
        }
        break;

    case 'login':
        if (!empty($data->email) && !empty($data->password)) {
            $email = $data->email;
            
            $query = "SELECT id, email, password, full_name, avatar_url FROM users WHERE email = :email LIMIT 1";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':email', $email);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if (password_verify($data->password, $row['password'])) {
                    // Remover hash da resposta
                    unset($row['password']);
                    
                    // Em um sistema real, gerar JWT aqui.
                    // Para simplificar, retornamos os dados do usuário.
                    
                    http_response_code(200);
                    echo json_encode(["message" => "Login realizado com sucesso.", "user" => $row, "token" => "mock_token_" . $row['id']]);
                } else {
                    http_response_code(401);
                    echo json_encode(["error" => "Senha incorreta."]);
                }
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Usuário não encontrado."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Dados incompletos."]);
        }
        break;

    case 'forgot_password':
        if (!empty($data->email)) {
            $email = $data->email;
            
            // Verificar se usuário existe
            $query = "SELECT id FROM users WHERE email = :email LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':email', $email);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $token = bin2hex(random_bytes(32));
                $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
                
                // Tentar atualizar tabela.
                try {
                    $updateQuery = "UPDATE users SET reset_token = :token, reset_expires = :expires WHERE email = :email";
                    $updateStmt = $db->prepare($updateQuery);
                    $updateStmt->bindParam(':token', $token);
                    $updateStmt->bindParam(':expires', $expires);
                    $updateStmt->bindParam(':email', $email);
                    $updateStmt->execute();
                    
                    // MOCK: Em produção, enviar email. Aqui retornamos o token para teste fácil.
                    // Na URL do frontend (ajustar porta conforme seu Vite): http://localhost:5173/reset-password?token=XYZ
                    $resetLink = "http://localhost:5173/reset-password?token=" . $token;
                    
                    http_response_code(200);
                    echo json_encode([
                        "message" => "Email de recuperação enviado (Simulado).", 
                        "debug_token" => $token,
                        "debug_link" => $resetLink
                    ]);
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(["error" => "Erro ao processar solicitação: " . $e->getMessage()]);
                }
            } else {
                // Por segurança, não informar se o email não existe
                http_response_code(200);
                echo json_encode(["message" => "Se o email existir, um link foi enviado."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Email necessário."]);
        }
        break;

    case 'reset_password':
        if (!empty($data->password) && !empty($data->token)) {
            $token = $data->token;
            $password = password_hash($data->password, PASSWORD_BCRYPT);
            
            // Verificar token e validade
            $query = "SELECT id FROM users WHERE reset_token = :token AND reset_expires > NOW() LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':token', $token);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                try {
                    $updateQuery = "UPDATE users SET password = :password, reset_token = NULL, reset_expires = NULL WHERE reset_token = :token";
                    $updateStmt = $db->prepare($updateQuery);
                    $updateStmt->bindParam(':password', $password);
                    $updateStmt->bindParam(':token', $token);
                    $updateStmt->execute();
                    
                    http_response_code(200);
                    echo json_encode(["message" => "Senha atualizada com sucesso."]);
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(["error" => "Erro ao atualizar senha: " . $e->getMessage()]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Token inválido ou expirado."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Dados incompletos."]);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(["error" => "Ação inválida."]);
        break;
}
