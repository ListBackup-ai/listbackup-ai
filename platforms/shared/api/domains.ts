import { BaseAPI } from './base'

export interface Domain {
  domainId: string
  accountId: string
  domainName: string
  domainType: 'site' | 'api' | 'mail'
  parentDomainId?: string
  brandingId?: string
  status: 'pending' | 'verifying' | 'verified' | 'active' | 'failed'
  verificationStatus: 'pending' | 'verified' | 'failed'
  sslStatus: 'pending' | 'issued' | 'failed'
  certificateArn?: string
  hostedZoneId?: string
  cloudfrontId?: string
  dnsRecords?: DNSRecord[]
  configuration: DomainConfig
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  activatedAt?: string
  metadata?: Record<string, string>
}

export interface DomainConfig {
  useWww: boolean
  forceHttps: boolean
  enableHsts: boolean
  customHeaders?: Record<string, string>
  redirects?: RedirectRule[]
  apiPrefix?: string
  mailSettings?: MailSettings
}

export interface RedirectRule {
  from: string
  to: string
  statusCode: number
}

export interface MailSettings {
  mxRecords: MXRecord[]
  spfRecord: string
  dkimKey?: string
  dmarcPolicy?: string
  catchAllEmail?: string
}

export interface MXRecord {
  priority: number
  value: string
}

export interface DNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX'
  name: string
  values: string[]
  ttl: number
}

export interface DomainVerification {
  domainId: string
  verificationToken: string
  verificationMethod: 'dns-txt' | 'dns-cname' | 'http-file'
  verificationRecord: DNSRecord
  status: 'pending' | 'verified' | 'failed'
  createdAt: string
  verifiedAt?: string
  expiresAt: string
  attempts: number
  lastCheckAt?: string
}

export interface AddDomainRequest {
  domainName: string
  domainType: 'site' | 'api' | 'mail'
  parentDomainId?: string
  brandingId?: string
  configuration: DomainConfig
}

export interface UpdateDomainRequest {
  brandingId?: string
  configuration?: Partial<DomainConfig>
  status?: string
}

export interface CreateDNSRecordsRequest {
  records: DNSRecord[]
}

export interface DomainListResponse {
  domains: Domain[]
}

export interface AddDomainResponse {
  domain: Domain
  verificationRequired: boolean
  verificationRecord?: DNSRecord
  instructions?: string
}

export interface DNSInstruction {
  recordType: string
  recordName: string
  recordValue: string
  priority?: number
  ttl: number
  purpose: string
  required: boolean
}

export interface ProviderGuide {
  name: string
  instructions: string
  helpUrl: string
}

export interface AlternativeSetup {
  method: string
  nameservers?: string[]
  instructions: string
}

export interface DNSInstructionsResponse {
  domain: Domain
  instructions: DNSInstruction[]
  verificationStatus: string
  provider: string
  estimatedTime: string
  supportedProviders: ProviderGuide[]
  alternativeSetup?: AlternativeSetup
}

export type MailProvider = 'google' | 'office365' | 'zoho' | 'fastmail' | 'custom' | 'listbackup'

export interface ConfigureMailRequest {
  provider: MailProvider
  customMx?: MXRecord[]
  enableSpf: boolean
  enableDkim: boolean
  enableDmarc: boolean
  catchAllEmail?: string
}

export interface MailConfigurationResponse {
  domain: Domain
  dnsRecords: Array<{
    type: string
    name: string
    value: string
    priority?: number
    ttl: number
    status: string
    purpose: string
  }>
  instructions: {
    provider: string
    steps: string[]
    warningNotes?: string[]
    helpUrl?: string
  }
}

class DomainsAPI extends BaseAPI {
  async add(data: AddDomainRequest): Promise<AddDomainResponse> {
    return this.post('/domains', data)
  }

  async list(): Promise<DomainListResponse> {
    return this.get('/domains')
  }

  async getDomain(domainId: string): Promise<Domain> {
    return this.get(`/domains/${domainId}`)
  }

  async update(domainId: string, data: UpdateDomainRequest): Promise<Domain> {
    return this.put(`/domains/${domainId}`, data)
  }

  async remove(domainId: string): Promise<void> {
    return this.delete(`/domains/${domainId}`)
  }

  async verify(domainId: string): Promise<{ success: boolean; message: string }> {
    return this.post(`/domains/${domainId}/verify`, {})
  }

  async checkVerification(domainId: string): Promise<DomainVerification> {
    return this.get(`/domains/${domainId}/verification-status`)
  }

  async requestCertificate(domainId: string): Promise<{ success: boolean; message: string }> {
    return this.post(`/domains/${domainId}/certificate`, {})
  }

  async createDNSRecords(domainId: string, data: CreateDNSRecordsRequest): Promise<{ success: boolean }> {
    return this.post(`/domains/${domainId}/dns`, data)
  }

  async getDNSInstructions(domainId: string): Promise<DNSInstructionsResponse> {
    return this.get(`/domains/${domainId}/dns-instructions`)
  }

  async configureMail(domainId: string, data: ConfigureMailRequest): Promise<MailConfigurationResponse> {
    return this.post(`/domains/${domainId}/mail-configuration`, data)
  }
}

export const domainsAPI = new DomainsAPI()