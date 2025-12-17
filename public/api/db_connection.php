<?php

// Define a constante DIRETORIO_BACKEND apenas se ainda não estiver definida
if (!defined('DIRETORIO_BACKEND')) {
    define('DIRETORIO_BACKEND', '../../backend/app/');
}


// Evita redefinir a classe DbConnection se já foi carregada anteriormente
if (!class_exists('DbConnection')) {
    class DbConnection
    {
        private $host = "127.0.0.1";
        private $dbname = "JC-Vision-Play";
        private $user = "root";
        private $pass = "";

        public function getConnection()
        {
            try {
                $dsn = "mysql:host={$this->host};dbname={$this->dbname};charset=utf8mb4";
                $connect = new PDO($dsn, $this->user, $this->pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_OBJ,
                ]);
                return $connect;
            } catch (PDOException $e) {
                return null;
            } catch (Exception $e) {
                return null;
            }
        }
    }
}
