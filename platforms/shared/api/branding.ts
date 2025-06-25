import { BaseAPI } from './base'

export interface Branding {
  brandingId: string
  accountId: string
  name: string
  description?: string
  logos: BrandLogos
  faviconUrl?: string // Base64 data URI
  colors: BrandColors
  fonts: BrandFonts
  customCss?: string
  emailSettings: EmailBranding
  socialLinks?: Record<string, string>
  settings: BrandingSettings
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  isDefault: boolean
}

export interface BrandLogos {
  light: LogoVariants
  dark: LogoVariants
}

export interface LogoVariants {
  full?: string // Full logo for expanded sidebar (base64 data URI)
  compact?: string // Small logo for collapsed sidebar (base64 data URI)
  square?: string // Square logo for various uses (base64 data URI)
}

export interface BrandingSettings {
  logoPlacement: 'center' | 'left' | 'right'
  loginLogoSize: 'small' | 'medium' | 'large'
  showCompanyName: boolean
  companyNamePosition: 'below' | 'beside'
}

export interface BrandColors {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  textMuted: string
  success: string
  warning: string
  error: string
  info: string
}

export interface BrandFonts {
  heading: string
  body: string
  monospace: string
  size: 'small' | 'medium' | 'large'
}

export interface EmailBranding {
  fromName: string
  fromEmail: string
  replyToEmail?: string
  footerText: string
  unsubscribeUrl?: string
}

export interface AddBrandingRequest {
  name: string
  description?: string
  colors: BrandColors
  fonts: BrandFonts
  customCss?: string
  emailSettings: EmailBranding
  socialLinks?: Record<string, string>
  settings: BrandingSettings
  isDefault: boolean
}

export interface UpdateBrandingRequest {
  name?: string
  description?: string
  colors?: BrandColors
  fonts?: BrandFonts
  customCss?: string
  emailSettings?: EmailBranding
  socialLinks?: Record<string, string>
  settings?: BrandingSettings
}

export interface UploadLogoRequest {
  imageData: string // base64 encoded
  contentType: 'image/png' | 'image/jpeg' | 'image/jpg'
  logoType: 'full' | 'compact' | 'square'
  theme: 'light' | 'dark'
}

export interface UploadFaviconRequest {
  imageData: string // base64 encoded
  contentType: 'image/png' | 'image/jpeg' | 'image/jpg' | 'image/x-icon'
}

export interface ImageUploadResponse {
  success: boolean
  message?: string
}

export interface BrandingListResponse {
  brandings: Branding[]
}

export interface PublicBrandingResponse {
  branding: Branding
  domain: string
}

class BrandingAPI extends BaseAPI {
  async add(data: AddBrandingRequest): Promise<Branding> {
    return this.post('/branding', data)
  }

  async list(): Promise<BrandingListResponse> {
    return this.get('/branding')
  }

  async getBranding(brandingId: string): Promise<Branding> {
    return this.get(`/branding/${brandingId}`)
  }

  async update(brandingId: string, data: UpdateBrandingRequest): Promise<Branding> {
    return this.put(`/branding/${brandingId}`, data)
  }

  async uploadLogo(brandingId: string, data: UploadLogoRequest): Promise<ImageUploadResponse> {
    return this.post(`/branding/${brandingId}/logo`, data)
  }

  async uploadFavicon(brandingId: string, data: UploadFaviconRequest): Promise<ImageUploadResponse> {
    return this.post(`/branding/${brandingId}/favicon`, data)
  }

  // Public endpoint - no auth required
  async getByDomain(domain: string): Promise<PublicBrandingResponse> {
    return this.get('/public/branding', { domain })
  }
}

export const brandingAPI = new BrandingAPI()