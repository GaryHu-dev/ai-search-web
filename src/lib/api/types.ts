export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface ApiErrorBody {
  statusCode: number
  error: string
  message: string | string[]
  requestId?: string
  path?: string
  timestamp?: string
}

