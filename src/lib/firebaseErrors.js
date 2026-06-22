// Firebase auth error codes -> Indian-context, user-facing copy.
const MESSAGES = {
  'auth/invalid-phone-number': 'That doesn’t look like a valid Indian mobile number. Use a 10-digit number.',
  'auth/missing-phone-number': 'Enter your mobile number to continue.',
  'auth/too-many-requests': 'Too many attempts. Please try after some time.',
  'auth/quota-exceeded': 'SMS limit reached for now. Please try again later.',
  'auth/invalid-verification-code': 'That OTP is incorrect. Check the SMS and try again.',
  'auth/code-expired': 'This OTP has expired. Request a new one.',
  'auth/missing-verification-code': 'Enter the 6-digit OTP sent to your phone.',
  'auth/captcha-check-failed': 'Verification failed. Please refresh the page and try again.',
  'auth/popup-closed-by-user': 'Sign-in window was closed before finishing. Please try again.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow popups for this site and try again.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method. Try the method you used originally.',
  'auth/network-request-failed': 'Network issue. Check your internet connection and try again.',
  'auth/user-disabled': 'This account has been disabled. Contact support for help.',
  'auth/operation-not-allowed': 'This sign-in method isn’t enabled yet. Please contact support.',
  'auth/internal-error': 'Something went wrong on our end. Please try again.',
}

export function friendlyAuthError(error) {
  const code = error?.code || ''
  return MESSAGES[code] || error?.message || 'Something went wrong. Please try again.'
}
