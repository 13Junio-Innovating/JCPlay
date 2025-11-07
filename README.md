# Display Forge

Sistema completo de sinalização digital para hotéis e estabelecimentos comerciais, desenvolvido com React, TypeScript e Supabase.

## 🚀 Funcionalidades

### 📺 Gestão de Telas
- Criação e gerenciamento de múltiplas telas
- Configuração automática de playlists para cada tela
- 10 telas pré-configuradas com conteúdo temático

### 🎵 Sistema de Playlists
- Criação de playlists personalizadas
- Associação automática de mídia por categoria
- Playlists temáticas: Bem-vindo, Cardápio, Entretenimento, Operacional e Totem

### 📱 Mídia e Conteúdo
- Upload de imagens e vídeos
- Rotação automática de mídia (0°, 90°, 180°, 270°)
- Suporte a SVG para gráficos vetoriais
- 5 mídias de exemplo pré-carregadas

### 🔄 Player Avançado
- Reprodução automática de playlists
- Sistema offline com cache local
- Indicadores visuais de status de conexão
- Transições suaves entre mídias

### 👥 Autenticação
- Sistema completo de login/registro
- Recuperação de senha
- Gestão de usuários via Supabase

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Notificações**: React Hot Toast
- **Ícones**: Lucide React

## 📦 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ e npm
- Conta no Supabase

### Passos de Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/13Junio-Innovating/display-forge-36.git

# 2. Navegue para o diretório
cd display-forge-36

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite o arquivo .env.local com suas credenciais do Supabase

# 5. Execute as migrações do banco
npx supabase db push

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

### Configuração do Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com)
2. Configure as seguintes variáveis no arquivo `.env.local`:
   ```
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```
3. Execute as migrações incluídas no projeto

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes da UI (shadcn)
│   └── Layout.tsx      # Layout principal
├── pages/              # Páginas da aplicação
│   ├── Dashboard.tsx   # Painel principal
│   ├── Media.tsx       # Gestão de mídia
│   ├── Playlists.tsx   # Gestão de playlists
│   ├── Screens.tsx     # Gestão de telas
│   ├── Player.tsx      # Player de mídia
│   └── ...            # Outras páginas
├── lib/               # Utilitários e configurações
└── App.tsx           # Componente raiz
```

## 🎯 Fluxo de Uso

1. **Registro/Login**: Acesse o sistema com suas credenciais
2. **Upload de Mídia**: Faça upload de imagens e vídeos na seção Mídia
3. **Criar Playlists**: Organize sua mídia em playlists temáticas
4. **Configurar Telas**: Crie telas e associe playlists
5. **Reprodução**: Use o Player para exibir conteúdo nas telas

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verificação de código
```

## 📱 Funcionalidades Offline

O sistema inclui suporte offline robusto:
- Cache automático de playlists e mídia
- Detecção de status de conexão
- Fallback para dados locais
- Indicadores visuais de modo offline

## 🎨 Temas e Personalização

O sistema vem com 5 temas pré-configurados:
- **Bem-vindo Hóspede**: Mensagens de boas-vindas
- **Cardápio Digital**: Menus e ofertas
- **Entretenimento Geral**: Conteúdo de entretenimento
- **Informações Operacionais**: Avisos e informações
- **Totem Vertical**: Conteúdo para displays verticais

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas, entre em contato através do [GitHub Issues](https://github.com/13Junio-Innovating/display-forge-36/issues).

---

Desenvolvido com ❤️ pela equipe 13Junio Innovating
