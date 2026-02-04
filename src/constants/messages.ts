/**
 * Application messages
 */

export const AUTH_ERRORS: Record<string, string> = {
  'auth/user-not-found': 'メールアドレスまたはパスワードが正しくありません',
  'auth/wrong-password': 'メールアドレスまたはパスワードが正しくありません',
  'auth/invalid-credential': 'メールアドレスまたはパスワードが正しくありません',
  'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
  'auth/weak-password': 'パスワードは6文字以上で入力してください',
  'auth/invalid-email': '有効なメールアドレスを入力してください',
  default: 'エラーが発生しました。もう一度お試しください'
}

export const GEOLOCATION_ERRORS: Record<string, string> = {
  'permission-denied': '位置情報の取得が許可されていません',
  'position-unavailable': '位置情報を取得できませんでした',
  'timeout': '位置情報の取得がタイムアウトしました',
  default: '位置情報の取得に失敗しました'
}

export const ATTENDANCE_ERRORS: Record<string, string> = {
  'already-clocked-in': '既に出勤済みです',
  'not-clocked-in': 'まだ出勤していません',
  'already-clocked-out': '既に退勤済みです',
  default: '勤怠記録の処理に失敗しました'
}

/**
 * Get error message by code
 */
export function getAuthErrorMessage(code: string): string {
  return AUTH_ERRORS[code] ?? AUTH_ERRORS.default
}

export function getGeolocationErrorMessage(code: string): string {
  return GEOLOCATION_ERRORS[code] ?? GEOLOCATION_ERRORS.default
}

export function getAttendanceErrorMessage(code: string): string {
  return ATTENDANCE_ERRORS[code] ?? ATTENDANCE_ERRORS.default
}
