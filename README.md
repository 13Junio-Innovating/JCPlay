# COSTAO JC-Vision Play

Sistema completo de sinalização digital para hotéis e estabelecimentos comerciais, desenvolvido com React, TypeScript, PHP e MySQL. Customizado para a marca COSTAO.

## 🚀 Funcionalidades

### 📺 Gestão de Telas
- Criação e gerenciamento de múltiplas telas
- Associação de playlists para cada tela
- Monitoramento de status online/offline
- Configuração de Player Key para dispositivos

### 🎵 Sistema de Playlists
- Criação de playlists personalizadas
- Organização sequencial de mídias
- Definição de duração por item
- Playlists temáticas e operacionais

### 📱 Mídia e Conteúdo
- Upload de imagens e vídeos
- Suporte a múltiplos formatos de mídia
- Organização centralizada de arquivos
- Gerenciamento otimizado com backend PHP

### 🔄 Player & Preview
- Player web responsivo para exibição em telas
- Cache local para operação offline
- Preview em tempo real das playlists
- Modo Kiosk para Raspberry Pi e outros dispositivos

### 👥 Autenticação & Segurança
- Sistema próprio de login e registro
- Recuperação de senha via token temporário
- Controle de sessão seguro
- Backend PHP com proteção contra SQL Injection

### 📊 Logs e Monitoramento
- Registro detalhado de atividades do usuário
- Logs de erros e exceções
- Dashboard de estatísticas de uso
- Armazenamento em banco de dados MySQL

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui
- **Backend**: PHP 8.0+ (Nativo)
- **Banco de Dados**: MySQL / MariaDB
- **Servidor Web**: Apache (via XAMPP)
- **Gerenciamento de Estado**: React Query + Context API

## 📦 Instalação e Configuração

### Pré-requisitos
- [XAMPP](https://www.apachefriends.org/) (PHP + MySQL + Apache)
- [Node.js](https://nodejs.org/) 18+ e npm

### Passos de Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/13Junio-Innovating/JCPlay.git
   cd JCPlay
   ```

2. **Instale as dependências do Frontend**
   ```bash
   npm install
   ```

3. **Configuração do Banco de Dados**
   - Inicie o Apache e MySQL no painel do XAMPP.
   - Abra o **PHPMyAdmin** (http://localhost/phpmyadmin).
   - Crie um banco de dados chamado `JC-Vision-Play`.
   - Importe o arquivo `database.sql` localizado na raiz do projeto.

4. **Configuração do Backend**
   - O arquivo de conexão já está configurado para o padrão do XAMPP (`root`, sem senha).
   - Se necessário, edite `public/api/db_connection.php` com suas credenciais.

5. **Build e Deploy**
   - Gere a versão de produção:
     ```bash
     npm run build
     ```
   - O projeto está configurado para rodar na pasta `/jcplay` do servidor web.
   - Copie todo o conteúdo da pasta `dist/` para `C:\xampp\htdocs\jcplay\`.
   *(Se a pasta `jcplay` não existir, crie-a dentro de `htdocs`)*

6. **Acesso**
   - Acesse o sistema em: **http://localhost/jcplay/**

## 🏗️ Estrutura do Projeto

```
JC-Vision_Play/
├── public/
│   └── api/            # Backend PHP (Endpoints API)
│       ├── auth.php    # Autenticação
│       ├── media.php   # Upload e gestão de mídia
│       ├── ...         # Outros endpoints
├── src/
│   ├── components/     # Componentes React reutilizáveis
│   ├── contexts/       # Contextos (Auth, etc)
│   ├── pages/          # Páginas da aplicação (Dashboard, Media, etc)
│   ├── services/       # Serviços de API (Axios/Fetch)
│   └── ...
├── database.sql        # Script de criação do banco MySQL
├── vite.config.ts      # Configuração do Vite (Base URL /jcplay/)
└── README.md           # Documentação do projeto
```

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---
Copyright © 2025 Junio Chaves - 13Junio Innovating
