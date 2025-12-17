// Tipos específicos para detalhes de atividades
export interface LoginDetails {
  email: string;
  success: boolean;
  error_message?: string;
}

export interface ScreenDetails {
  screen_id: string;
  screen_name: string;
  playlist_id?: string;
  playlist_name?: string;
}

export interface PlaylistDetails {
  playlist_id: string;
  playlist_name: string;
  media_count: number;
}

export interface MediaDetails {
  media_id: string;
  media_name: string;
  file_type: string;
  file_size?: number;
  duration?: number;
  rotation?: number;
}

export interface PlayerDetails {
  playlist_id: string;
  playlist_name: string;
  media_count: number;
  offline_status: boolean;
}

// Union type para todos os possíveis detalhes de atividade
export type ActivityDetails = 
  | LoginDetails 
  | ScreenDetails 
  | PlaylistDetails 
  | MediaDetails 
  | PlayerDetails 
  | Record<string, string | number | boolean>;

// Tipos específicos para contextos de erro
export interface JavaScriptErrorContext {
  filename?: string;
  lineno?: number;
  colno?: number;
}

export interface PromiseRejectionContext {
  promise?: string;
}

export interface DatabaseErrorContext {
  table?: string;
  operation?: string;
  query?: string;
}

export interface AuthErrorContext {
  action?: string;
  email?: string;
}

export interface FileOperationContext {
  file_name?: string;
  file_size?: number;
  operation?: string;
}

// Union type para todos os possíveis contextos de erro
export type ErrorContext = 
  | JavaScriptErrorContext 
  | PromiseRejectionContext 
  | DatabaseErrorContext 
  | AuthErrorContext 
  | FileOperationContext 
  | Record<string, string | number | boolean>;

export interface UserActivityLog {
  id?: string;
  user_id?: string;
  action: string;
  resource?: string;
  resource_id?: string;
  details?: ActivityDetails;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export interface ErrorLog {
  id?: string;
  user_id?: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  url?: string;
  user_agent?: string;
  ip_address?: string;
  context?: ErrorContext;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  resolved?: boolean;
  created_at?: string;
}

export interface LogsStats {
  user_activities_today: number;
  user_activities_week: number;
  errors_today: number;
  errors_week: number;
  unresolved_errors: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

class LoggingService {
  private getUserId(): string | undefined {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
    return undefined;
  }

  async logUserActivity(
    action: string,
    resource?: string,
    resourceId?: string,
    details?: ActivityDetails
  ) {
    try {
      const userId = this.getUserId();
      
      await fetch(`${API_BASE_URL}/logs.php?type=activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action,
          resource,
          resource_id: resourceId,
          details
        })
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Fallback to local storage if needed
      this.saveToLocalStorage('activity_logs', { action, resource, resourceId, details, timestamp: new Date().toISOString() });
    }
  }

  async logError(
    error: Error,
    errorType: string,
    context?: ErrorContext,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    try {
      const userId = this.getUserId();

      await fetch(`${API_BASE_URL}/logs.php?type=error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          error_type: errorType,
          error_message: error.message,
          severity,
          context
        })
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
      this.saveToLocalStorage('error_logs', { error: error.message, errorType, context, severity, timestamp: new Date().toISOString() });
    }
  }

  private saveToLocalStorage(key: string, data: any) {
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(data);
      // Limit to last 50 logs
      if (existing.length > 50) existing.shift();
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save log to local storage', e);
    }
  }

  async getLogsStats(): Promise<LogsStats | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/logs.php?action=stats`);
      return response.json();
    } catch (error) {
      console.error("Error fetching stats:", error);
      return null;
    }
  }

  async getUserActivityLogs(limit: number = 50, offset: number = 0): Promise<UserActivityLog[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/logs.php?type=activity&limit=${limit}&offset=${offset}`);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      return [];
    }
  }

  async getErrorLogs(limit: number = 50, offset: number = 0): Promise<ErrorLog[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/logs.php?type=error&limit=${limit}&offset=${offset}`);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching error logs:", error);
      return [];
    }
  }

  async resolveError(errorId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/logs.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: errorId, resolved: true })
      });
      return response.ok;
    } catch (error) {
      console.error("Error resolving error:", error);
      return false;
    }
  }
}

export const loggingService = new LoggingService();

// Interceptador global de erros
window.addEventListener('error', (event) => {
  const context: JavaScriptErrorContext = {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  };
  
  loggingService.logError(
    event.error || event.message,
    'javascript_error',
    context,
    'high'
  );
});

// Interceptador de promessas rejeitadas
window.addEventListener('unhandledrejection', (event) => {
  const context: PromiseRejectionContext = {
    promise: event.promise?.toString(),
  };
  
  loggingService.logError(
    event.reason,
    'unhandled_promise_rejection',
    context,
    'high'
  );
});

export default loggingService;