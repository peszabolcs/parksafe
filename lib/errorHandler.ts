import { AuthError } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/supabase-js';

export interface ErrorResult {
  userMessage: string;
  shouldRetry: boolean;
  isNetworkError: boolean;
  originalError?: any;
}

export class ErrorHandler {
  private static readonly NETWORK_ERROR_KEYWORDS = [
    'network',
    'connection',
    'timeout',
    'fetch',
    'cors',
    'offline',
    'internet',
    'dns'
  ];

  private static readonly AUTH_ERROR_MESSAGES: Record<string, string> = {
    // Auth errors
    'Invalid login credentials': 'Hibás email cím vagy jelszó.',
    'Email not confirmed': 'Kérjük, erősítse meg email címét a bejelentkezés előtt.',
    'Too many requests': 'Túl sok bejelentkezési kísérlet. Kérjük, várjon néhány percet.',
    'User not found': 'Nem található felhasználó ezzel az email címmel.',
    'Invalid email': 'Érvénytelen email cím formátum.',
    'Email already registered': 'Ezzel az email címmel már létezik fiók.',
    'Password too short': 'A jelszó túl rövid.',
    'Weak password': 'A jelszó túl gyenge. Használjon nagyobb és kisbetűket, számokat.',
    'Invalid refresh token': 'Bejelentkezési munkamenet lejárt. Kérjük, jelentkezzen be újra.',
    'Invalid token': 'Érvénytelen munkamenet. Kérjük, jelentkezzen be újra.',
    'Email link is invalid or has expired': 'Az email link érvénytelen vagy lejárt.',
    'Token has expired or is invalid': 'A munkamenet lejárt vagy érvénytelen.',
    'User already registered': 'Ezzel az email címmel már regisztráltak.',
    'Signup disabled': 'A regisztráció jelenleg nem elérhető.',
  };

  private static readonly DATABASE_ERROR_MESSAGES: Record<string, string> = {
    // Database constraint errors
    'duplicate key value violates unique constraint': 'Ez az adat már létezik a rendszerben.',
    'foreign key constraint': 'Érvénytelen adatkapcsolat.',
    'check constraint': 'Az adatok nem felelnek meg a követelményeknek.',
    'not null constraint': 'Kötelező mező hiányzik.',
    // RLS (Row Level Security) errors
    'new row violates row-level security policy': 'Nincs jogosultsága ehhez a művelethez.',
    'permission denied': 'Nincs jogosultsága ehhez a művelethez.',
  };

  private static readonly GENERAL_ERROR_MESSAGES: Record<string, string> = {
    'Failed to fetch': 'Hálózati kapcsolat hiba. Ellenőrizze internetkapcsolatát.',
    'NetworkError': 'Hálózati hiba. Kérjük, ellenőrizze internetkapcsolatát.',
    'TypeError: Network request failed': 'Hálózati hiba. Kérjük, ellenőrizze internetkapcsolatát.',
    'timeout': 'A kérés időtúllépés miatt megszakadt. Próbálja újra.',
    'AbortError': 'A művelet megszakadt.',
  };

  static handle(error: any): ErrorResult {
    console.error('Error being handled:', error);

    // Handle null/undefined errors
    if (!error) {
      return {
        userMessage: 'Ismeretlen hiba történt.',
        shouldRetry: true,
        isNetworkError: false,
        originalError: error
      };
    }

    // Handle string errors
    if (typeof error === 'string') {
      return this.handleStringError(error);
    }

    // Handle Supabase Auth errors
    if (this.isAuthError(error)) {
      return this.handleAuthError(error);
    }

    // Handle Supabase Database errors
    if (this.isPostgrestError(error)) {
      return this.handleDatabaseError(error);
    }

    // Handle network errors
    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error);
    }

    // Handle Google Auth errors
    if (this.isGoogleAuthError(error)) {
      return this.handleGoogleAuthError(error);
    }

    // Handle general errors with message property
    if (error.message) {
      return this.handleStringError(error.message);
    }

    // Fallback for unknown errors
    return {
      userMessage: 'Váratlan hiba történt. Kérjük, próbálja újra később.',
      shouldRetry: true,
      isNetworkError: false,
      originalError: error
    };
  }

  private static handleStringError(errorMessage: string): ErrorResult {
    const lowerMessage = errorMessage.toLowerCase();

    // Check for network error keywords
    const isNetworkError = this.NETWORK_ERROR_KEYWORDS.some(keyword => 
      lowerMessage.includes(keyword)
    );

    if (isNetworkError) {
      return {
        userMessage: 'Hálózati kapcsolat hiba. Ellenőrizze internetkapcsolatát.',
        shouldRetry: true,
        isNetworkError: true,
        originalError: errorMessage
      };
    }

    // Check auth error messages (exact match first, then contains)
    if (this.AUTH_ERROR_MESSAGES[errorMessage]) {
      return {
        userMessage: this.AUTH_ERROR_MESSAGES[errorMessage],
        shouldRetry: errorMessage.includes('Too many requests') || errorMessage.includes('network'),
        isNetworkError: false,
        originalError: errorMessage
      };
    }

    // Check auth error messages by substring
    for (const [key, message] of Object.entries(this.AUTH_ERROR_MESSAGES)) {
      if (errorMessage.includes(key)) {
        return {
          userMessage: message,
          shouldRetry: key.includes('Too many requests') || key.includes('network'),
          isNetworkError: false,
          originalError: errorMessage
        };
      }
    }

    // Check general error messages
    for (const [key, message] of Object.entries(this.GENERAL_ERROR_MESSAGES)) {
      if (errorMessage.includes(key)) {
        return {
          userMessage: message,
          shouldRetry: true,
          isNetworkError: key.toLowerCase().includes('network') || key.toLowerCase().includes('fetch'),
          originalError: errorMessage
        };
      }
    }

    // Default case
    return {
      userMessage: errorMessage.length > 100 
        ? 'Váratlan hiba történt. Kérjük, próbálja újra.'
        : errorMessage,
      shouldRetry: true,
      isNetworkError: false,
      originalError: errorMessage
    };
  }

  private static handleAuthError(error: AuthError): ErrorResult {
    const message = error.message || '';
    
    // Handle specific auth error codes
    if (error.message && this.AUTH_ERROR_MESSAGES[error.message]) {
      return {
        userMessage: this.AUTH_ERROR_MESSAGES[error.message],
        shouldRetry: error.message.includes('Too many requests'),
        isNetworkError: false,
        originalError: error
      };
    }

    // Handle email already exists case
    if (message.includes('already') && message.includes('email')) {
      return {
        userMessage: 'Ezzel az email címmel már létezik fiók. Próbálja meg a bejelentkezést.',
        shouldRetry: false,
        isNetworkError: false,
        originalError: error
      };
    }

    // Handle password issues
    if (message.includes('password')) {
      if (message.includes('short') || message.includes('length')) {
        return {
          userMessage: 'A jelszó legalább 8 karakter hosszú kell legyen.',
          shouldRetry: false,
          isNetworkError: false,
          originalError: error
        };
      }
      if (message.includes('weak') || message.includes('strength')) {
        return {
          userMessage: 'A jelszó túl gyenge. Használjon nagyobb és kisbetűket, számokat és speciális karaktereket.',
          shouldRetry: false,
          isNetworkError: false,
          originalError: error
        };
      }
    }

    return {
      userMessage: 'Bejelentkezési hiba történt. Kérjük, ellenőrizze adatait.',
      shouldRetry: true,
      isNetworkError: false,
      originalError: error
    };
  }

  private static handleDatabaseError(error: PostgrestError): ErrorResult {
    const message = error.message || error.details || '';

    // Check database error messages
    for (const [key, userMessage] of Object.entries(this.DATABASE_ERROR_MESSAGES)) {
      if (message.includes(key)) {
        return {
          userMessage,
          shouldRetry: key.includes('network') || key.includes('connection'),
          isNetworkError: false,
          originalError: error
        };
      }
    }

    // Handle unique constraint violations with more specific context
    if (message.includes('unique') || message.includes('duplicate')) {
      if (message.includes('username') || message.includes('user')) {
        return {
          userMessage: 'Ez a felhasználónév már foglalt. Kérjük, válasszon másikat.',
          shouldRetry: false,
          isNetworkError: false,
          originalError: error
        };
      }
      if (message.includes('email')) {
        return {
          userMessage: 'Ezzel az email címmel már létezik fiók.',
          shouldRetry: false,
          isNetworkError: false,
          originalError: error
        };
      }
    }

    return {
      userMessage: 'Adatbázis hiba történt. Kérjük, próbálja újra később.',
      shouldRetry: true,
      isNetworkError: false,
      originalError: error
    };
  }

  private static handleNetworkError(error: any): ErrorResult {
    return {
      userMessage: 'Hálózati kapcsolat hiba. Ellenőrizze internetkapcsolatát és próbálja újra.',
      shouldRetry: true,
      isNetworkError: true,
      originalError: error
    };
  }

  private static handleGoogleAuthError(error: any): ErrorResult {
    const message = error.message || error.error || '';

    if (message.includes('cancelled') || message.includes('canceled')) {
      return {
        userMessage: 'Google bejelentkezés megszakítva.',
        shouldRetry: true,
        isNetworkError: false,
        originalError: error
      };
    }

    if (message.includes('network') || message.includes('connection')) {
      return {
        userMessage: 'Hálózati hiba a Google bejelentkezés során. Ellenőrizze internetkapcsolatát.',
        shouldRetry: true,
        isNetworkError: true,
        originalError: error
      };
    }

    return {
      userMessage: 'Google bejelentkezési hiba. Kérjük, próbálja újra.',
      shouldRetry: true,
      isNetworkError: false,
      originalError: error
    };
  }

  // Type guards
  private static isAuthError(error: any): error is AuthError {
    return error && typeof error === 'object' && 'message' in error && (
      error.constructor.name === 'AuthError' ||
      error.name === 'AuthError' ||
      (error.message && typeof error.message === 'string')
    );
  }

  private static isPostgrestError(error: any): error is PostgrestError {
    return error && typeof error === 'object' && (
      'code' in error ||
      'details' in error ||
      error.constructor.name === 'PostgrestError' ||
      error.name === 'PostgrestError'
    );
  }

  private static isNetworkError(error: any): boolean {
    if (!error) return false;

    // Check error name/type
    if (error.name === 'NetworkError') return true;
    
    // Check error message
    if (error.message) {
      const lowerMessage = error.message.toLowerCase();
      return this.NETWORK_ERROR_KEYWORDS.some(keyword => 
        lowerMessage.includes(keyword)
      );
    }

    // Check if it's a fetch error
    if (error instanceof TypeError && error.message && error.message.toLowerCase().includes('fetch')) {
      return true;
    }

    return false;
  }

  private static isGoogleAuthError(error: any): boolean {
    if (!error) return false;

    // Check if it's related to Google Auth
    const errorString = JSON.stringify(error).toLowerCase();
    return errorString.includes('google') || 
           errorString.includes('oauth') ||
           (error.message && error.message.includes('google'));
  }

  // Utility method to check if user should be signed out
  static shouldSignOut(error: any): boolean {
    if (!error) return false;

    const errorString = (error.message || error.error || JSON.stringify(error)).toLowerCase();
    
    return errorString.includes('invalid refresh token') ||
           errorString.includes('invalid token') ||
           errorString.includes('token has expired') ||
           errorString.includes('session expired') ||
           errorString.includes('unauthorized');
  }

  // Utility method to get retry delay
  static getRetryDelay(error: any): number {
    if (!error) return 1000;

    const errorString = (error.message || error.error || JSON.stringify(error)).toLowerCase();
    
    // Longer delay for rate limiting
    if (errorString.includes('too many requests') || errorString.includes('rate limit')) {
      return 60000; // 1 minute
    }
    
    // Medium delay for network errors
    if (this.handle(error).isNetworkError) {
      return 5000; // 5 seconds
    }
    
    // Default delay
    return 2000; // 2 seconds
  }
}

// Convenience function for quick error handling
export function handleError(error: any): ErrorResult {
  return ErrorHandler.handle(error);
}

// Convenience function to display user-friendly error message
export function getErrorMessage(error: any): string {
  return ErrorHandler.handle(error).userMessage;
}