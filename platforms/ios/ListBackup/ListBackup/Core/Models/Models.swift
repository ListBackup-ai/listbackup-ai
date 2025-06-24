//
//  Models.swift
//  ListBackup
//
//  Core data models for the app
//

import Foundation

// MARK: - Integration Models

struct Integration: Identifiable, Codable {
    let id: String
    let name: String
    let type: String
    let description: String
    let icon: String?
    let color: String?
    let features: [String]
    let requiredFields: [IntegrationField]
    let supportedDataTypes: [String]
    let isAvailable: Bool
    let isPremium: Bool
    
    var iconSystemName: String {
        switch type.lowercased() {
        case "keap":
            return "person.2.circle.fill"
        case "stripe":
            return "creditcard.circle.fill"
        case "gohighlevel":
            return "chart.line.uptrend.xyaxis.circle.fill"
        case "mailchimp":
            return "envelope.circle.fill"
        case "activecampaign":
            return "bell.circle.fill"
        case "hubspot":
            return "building.2.circle.fill"
        case "shopify":
            return "cart.circle.fill"
        case "zendesk":
            return "bubble.left.and.bubble.right.fill"
        default:
            return "puzzlepiece.extension.fill"
        }
    }
    
    var displayColor: String {
        color ?? "#3B82F6"
    }
}

struct IntegrationField: Codable {
    let key: String
    let label: String
    let type: FieldType
    let required: Bool
    let placeholder: String?
    let helpText: String?
    
    enum FieldType: String, Codable {
        case text
        case password
        case email
        case url
        case select
        case oauth
    }
}

// MARK: - Source Models

struct Source: Identifiable, Codable {
    let id: String
    let accountId: String
    let name: String
    let type: String
    let status: SourceStatus
    let configuration: [String: Any]?
    let lastSyncDate: Date?
    let createdAt: Date
    let updatedAt: Date
    let metrics: SourceMetrics?
    
    enum SourceStatus: String, Codable {
        case active
        case inactive
        case syncing
        case error
        case pending
        
        var displayColor: String {
            switch self {
            case .active:
                return "green"
            case .inactive:
                return "gray"
            case .syncing:
                return "blue"
            case .error:
                return "red"
            case .pending:
                return "orange"
            }
        }
    }
    
    enum CodingKeys: String, CodingKey {
        case id, accountId, name, type, status, configuration
        case lastSyncDate, createdAt, updatedAt, metrics
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        accountId = try container.decode(String.self, forKey: .accountId)
        name = try container.decode(String.self, forKey: .name)
        type = try container.decode(String.self, forKey: .type)
        status = try container.decode(SourceStatus.self, forKey: .status)
        configuration = try container.decodeIfPresent([String: Any].self, forKey: .configuration)
        lastSyncDate = try container.decodeIfPresent(Date.self, forKey: .lastSyncDate)
        createdAt = try container.decode(Date.self, forKey: .createdAt)
        updatedAt = try container.decode(Date.self, forKey: .updatedAt)
        metrics = try container.decodeIfPresent(SourceMetrics.self, forKey: .metrics)
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(accountId, forKey: .accountId)
        try container.encode(name, forKey: .name)
        try container.encode(type, forKey: .type)
        try container.encode(status, forKey: .status)
        try container.encodeIfPresent(configuration, forKey: .configuration)
        try container.encodeIfPresent(lastSyncDate, forKey: .lastSyncDate)
        try container.encode(createdAt, forKey: .createdAt)
        try container.encode(updatedAt, forKey: .updatedAt)
        try container.encodeIfPresent(metrics, forKey: .metrics)
    }
}

struct SourceMetrics: Codable {
    let totalRecords: Int
    let totalSize: Int64
    let lastSyncDuration: TimeInterval?
    let lastSyncRecords: Int?
    let errorCount: Int
}

// MARK: - Job Models

struct Job: Identifiable, Codable {
    let id: String
    let sourceId: String
    let accountId: String
    let name: String
    let type: JobType
    let schedule: JobSchedule?
    let status: JobStatus
    let lastRunDate: Date?
    let nextRunDate: Date?
    let createdAt: Date
    let updatedAt: Date
    let configuration: JobConfiguration?
    
    enum JobType: String, Codable {
        case backup
        case sync
        case export
        case migration
    }
    
    enum JobStatus: String, Codable {
        case active
        case paused
        case running
        case completed
        case failed
        case scheduled
        
        var displayColor: String {
            switch self {
            case .active, .scheduled:
                return "green"
            case .paused:
                return "yellow"
            case .running:
                return "blue"
            case .completed:
                return "gray"
            case .failed:
                return "red"
            }
        }
    }
}

struct JobSchedule: Codable {
    let frequency: Frequency
    let time: String? // HH:mm format
    let dayOfWeek: Int? // 0-6 (Sunday-Saturday)
    let dayOfMonth: Int? // 1-31
    
    enum Frequency: String, Codable {
        case manual
        case hourly
        case daily
        case weekly
        case monthly
    }
}

struct JobConfiguration: Codable {
    let dataTypes: [String]?
    let incremental: Bool
    let compressionEnabled: Bool
    let encryptionEnabled: Bool
    let retentionDays: Int?
    let destination: ExportDestination?
}

struct ExportDestination: Codable {
    let type: String // s3, gdrive, dropbox, etc.
    let configuration: [String: String]
}

// MARK: - Activity Models

struct Activity: Identifiable, Codable {
    let id: String
    let eventId: String
    let accountId: String
    let userId: String?
    let sourceId: String?
    let jobId: String?
    let type: ActivityType
    let title: String
    let description: String?
    let metadata: [String: Any]?
    let timestamp: Date
    
    enum ActivityType: String, Codable {
        case backup_started
        case backup_completed
        case backup_failed
        case source_created
        case source_updated
        case source_deleted
        case sync_started
        case sync_completed
        case sync_failed
        case export_completed
        case user_login
        case settings_changed
        
        var icon: String {
            switch self {
            case .backup_started, .sync_started:
                return "play.circle.fill"
            case .backup_completed, .sync_completed:
                return "checkmark.circle.fill"
            case .backup_failed, .sync_failed:
                return "exclamationmark.circle.fill"
            case .source_created:
                return "plus.circle.fill"
            case .source_updated:
                return "pencil.circle.fill"
            case .source_deleted:
                return "trash.circle.fill"
            case .export_completed:
                return "square.and.arrow.up.circle.fill"
            case .user_login:
                return "person.circle.fill"
            case .settings_changed:
                return "gear.circle.fill"
            }
        }
        
        var color: String {
            switch self {
            case .backup_completed, .sync_completed, .export_completed:
                return "green"
            case .backup_failed, .sync_failed:
                return "red"
            case .backup_started, .sync_started:
                return "blue"
            case .source_created, .source_updated:
                return "purple"
            case .source_deleted:
                return "orange"
            case .user_login, .settings_changed:
                return "gray"
            }
        }
    }
    
    enum CodingKeys: String, CodingKey {
        case id, eventId, accountId, userId, sourceId, jobId
        case type, title, description, metadata, timestamp
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        eventId = try container.decode(String.self, forKey: .eventId)
        accountId = try container.decode(String.self, forKey: .accountId)
        userId = try container.decodeIfPresent(String.self, forKey: .userId)
        sourceId = try container.decodeIfPresent(String.self, forKey: .sourceId)
        jobId = try container.decodeIfPresent(String.self, forKey: .jobId)
        type = try container.decode(ActivityType.self, forKey: .type)
        title = try container.decode(String.self, forKey: .title)
        description = try container.decodeIfPresent(String.self, forKey: .description)
        metadata = try container.decodeIfPresent([String: Any].self, forKey: .metadata)
        timestamp = try container.decode(Date.self, forKey: .timestamp)
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(eventId, forKey: .eventId)
        try container.encode(accountId, forKey: .accountId)
        try container.encodeIfPresent(userId, forKey: .userId)
        try container.encodeIfPresent(sourceId, forKey: .sourceId)
        try container.encodeIfPresent(jobId, forKey: .jobId)
        try container.encode(type, forKey: .type)
        try container.encode(title, forKey: .title)
        try container.encodeIfPresent(description, forKey: .description)
        try container.encodeIfPresent(metadata, forKey: .metadata)
        try container.encode(timestamp, forKey: .timestamp)
    }
}

// MARK: - File Models

struct FileItem: Identifiable, Codable {
    let id: String
    let sourceId: String
    let jobRunId: String?
    let path: String
    let name: String
    let size: Int64
    let mimeType: String?
    let checksum: String?
    let createdAt: Date
    let modifiedAt: Date
    let metadata: FileMetadata?
    
    var fileExtension: String {
        (name as NSString).pathExtension.lowercased()
    }
    
    var icon: String {
        switch fileExtension {
        case "json":
            return "doc.text.fill"
        case "csv":
            return "tablecells.fill"
        case "xml":
            return "doc.richtext.fill"
        case "zip", "gz", "tar":
            return "doc.zipper"
        case "pdf":
            return "doc.fill"
        case "xlsx", "xls":
            return "tablecells.badge.ellipsis"
        default:
            return "doc.fill"
        }
    }
}

struct FileMetadata: Codable {
    let recordCount: Int?
    let dataType: String?
    let compressed: Bool
    let encrypted: Bool
    let schema: [String: String]?
}

// MARK: - Response Wrappers

struct ListResponse<T: Codable>: Codable {
    let items: [T]
    let total: Int
    let limit: Int
    let offset: Int
    let hasMore: Bool
}

struct SingleResponse<T: Codable>: Codable {
    let data: T
}

// MARK: - Helper Extensions

extension Encodable {
    func asDictionary() throws -> [String: Any] {
        let data = try JSONEncoder().encode(self)
        guard let dictionary = try JSONSerialization.jsonObject(with: data, options: .allowFragments) as? [String: Any] else {
            throw EncodingError.invalidValue(self, EncodingError.Context(codingPath: [], debugDescription: "Failed to encode as dictionary"))
        }
        return dictionary
    }
}