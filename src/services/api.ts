export interface ApiUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface AuthResponse {
  message?: string;
  error?: string;
  user?: ApiUser;
  token?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      const response = await fetch(`${API_BASE_URL}/auth.php?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return response.json();
    },
    register: async (email: string, password: string, full_name?: string): Promise<AuthResponse> => {
      const response = await fetch(`${API_BASE_URL}/auth.php?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name }),
      });
      return response.json();
    },
    forgotPassword: async (email: string): Promise<AuthResponse> => {
      const response = await fetch(`${API_BASE_URL}/auth.php?action=forgot_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return response.json();
    },
    resetPassword: async (password: string, token: string): Promise<AuthResponse> => {
      const response = await fetch(`${API_BASE_URL}/auth.php?action=reset_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, token }),
      });
      return response.json();
    }
  },
  screens: {
    list: async (userId: string) => {
      const response = await fetch(`${API_BASE_URL}/screens.php?user_id=${userId}`);
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Falha ao listar telas: ${response.status} ${text.slice(0,200)}`);
      }
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Resposta inválida do servidor (esperado JSON): ${text.slice(0,200)}`);
      }
      return response.json();
    },
    create: async (name: string, userId: string) => {
      const response = await fetch(`${API_BASE_URL}/screens.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, user_id: userId }),
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Falha ao criar tela: ${response.status} ${text.slice(0,200)}`);
      }
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Resposta inválida do servidor (esperado JSON): ${text.slice(0,200)}`);
      }
      return response.json();
    },
    delete: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/screens.php?id=${id}`, {
            method: 'DELETE',
        });
        return response.json();
    },
    updatePlaylist: async (screenId: string, playlistId: string | null) => {
        const response = await fetch(`${API_BASE_URL}/screens.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: screenId, assigned_playlist: playlistId }),
        });
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Falha ao atualizar playlist: ${response.status} ${text.slice(0,200)}`);
        }
        if (!contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(`Resposta inválida do servidor (esperado JSON): ${text.slice(0,200)}`);
        }
        return response.json();
    }
  },
  playlists: {
    list: async (userId: string) => {
      const response = await fetch(`${API_BASE_URL}/playlists.php?user_id=${userId}`);
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Falha ao listar playlists: ${response.status} ${text.slice(0,200)}`);
      }
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Resposta inválida do servidor (esperado JSON): ${text.slice(0,200)}`);
      }
      return response.json();
    },
    get: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/playlists.php?id=${id}`);
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Falha ao buscar playlist: ${response.status} ${text.slice(0,200)}`);
        }
        if (!contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Resposta inválida do servidor (esperado JSON): ${text.slice(0,200)}`);
        }
        return response.json();
    },
    create: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/playlists.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Falha ao criar playlist: ${response.status} ${text.slice(0,200)}`);
        }
        if (!contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Resposta inválida do servidor (esperado JSON): ${text.slice(0,200)}`);
        }
        return response.json();
    },
    update: async (id: string, data: any) => {
        const response = await fetch(`${API_BASE_URL}/playlists.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
        });
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Falha ao atualizar playlist: ${response.status} ${text.slice(0,200)}`);
        }
        if (!contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Resposta inválida do servidor (esperado JSON): ${text.slice(0,200)}`);
        }
        return response.json();
    },
    delete: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/playlists.php?id=${id}`, {
            method: 'DELETE',
        });
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Falha ao excluir playlist: ${response.status} ${text.slice(0,200)}`);
        }
        if (!contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Resposta inválida do servidor (esperado JSON): ${text.slice(0,200)}`);
        }
        return response.json();
    }
  },
  media: {
    list: async (userId: string) => {
      const response = await fetch(`${API_BASE_URL}/media.php?user_id=${userId}`);
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Falha ao listar mídias: ${response.status} ${text.slice(0,200)}`);
      }
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Resposta inválida do servidor (esperado JSON): ${text.slice(0,200)}`);
      }
      return response.json();
    },
    getByIds: async (ids: string[]) => {
      const idsParam = ids.join(',');
      const response = await fetch(`${API_BASE_URL}/media.php?ids=${idsParam}`);
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Falha ao buscar mídias: ${response.status} ${text.slice(0,200)}`);
      }
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Resposta inválida do servidor (esperado JSON): ${text.slice(0,200)}`);
      }
      return response.json();
    },
    upload: async (formData: FormData) => {
      const response = await fetch(`${API_BASE_URL}/media.php`, {
        method: 'POST',
        body: formData,
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Falha ao enviar mídia: ${response.status} ${text.slice(0,200)}`);
      }
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Resposta inválida do servidor (esperado JSON): ${text.slice(0,200)}`);
      }
      return response.json();
    },
    createLink: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/media.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Falha ao adicionar link: ${response.status} ${text.slice(0,200)}`);
      }
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Resposta inválida do servidor (esperado JSON): ${text.slice(0,200)}`);
      }
      return response.json();
    },
    delete: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/media.php?id=${id}`, {
        method: 'DELETE',
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Falha ao excluir mídia: ${response.status} ${text.slice(0,200)}`);
      }
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Resposta inválida do servidor (esperado JSON): ${text.slice(0,200)}`);
      }
      return response.json();
    }
  },
  player: {
    getData: async (key: string) => {
      const response = await fetch(`${API_BASE_URL}/player.php?key=${key}`);
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Falha ao buscar dados do player: ${response.status} ${text.slice(0,200)}`);
      }
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Resposta inválida do servidor (esperado JSON): ${text.slice(0,200)}`);
      }
      return response.json();
    },
    heartbeat: async (key: string) => {
      await fetch(`${API_BASE_URL}/player.php?key=${key}&action=heartbeat`, {
        method: 'POST',
      });
    }
  }
};
