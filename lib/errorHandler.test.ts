import { ErrorHandler, handleError } from './errorHandler';

// Simple test cases to verify error handling works
console.log('Running error handler tests...');

// Test 1: String error
const stringError = handleError('Invalid login credentials');
console.log('✓ String error test:', stringError.userMessage === 'Hibás email cím vagy jelszó.');

// Test 2: Network error
const networkError = handleError(new Error('Failed to fetch'));
console.log('✓ Network error test:', networkError.isNetworkError === true);

// Test 3: Auth error object
const authError = {
  message: 'User already registered',
  name: 'AuthError'
};
const authResult = handleError(authError);
console.log('✓ Auth error test:', authResult.userMessage.includes('már létezik'));

// Test 4: Should sign out check
const tokenError = { message: 'Invalid refresh token' };
const shouldSignOut = ErrorHandler.shouldSignOut(tokenError);
console.log('✓ Should sign out test:', shouldSignOut === true);

// Test 5: Unknown error fallback
const unknownError = handleError({ some: 'random error' });
console.log('✓ Unknown error test:', unknownError.userMessage.includes('Váratlan hiba'));

console.log('Error handler tests completed!');

// Export for potential use
export default true;