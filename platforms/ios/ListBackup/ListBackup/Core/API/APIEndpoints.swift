//
//  APIEndpoints.swift
//  ListBackup
//
//  Defines all API endpoints for the app
//

import Foundation

extension APIEndpoint {
    // MARK: - Authentication
    
    static func login(email: String, password: String) -> APIEndpoint {
        APIEndpoint(
            path: "/auth/login",
            method: .post,
            body: ["email": email, "password": password]
        )
    }
    
    static func register(email: String, password: String, firstName: String, lastName: String) -> APIEndpoint {
        APIEndpoint(
            path: "/auth/register",
            method: .post,
            body: [
                "email": email,
                "password": password,
                "firstName": firstName,
                "lastName": lastName
            ]
        )
    }
    
    static func refreshToken(refreshToken: String) -> APIEndpoint {
        APIEndpoint(
            path: "/auth/refresh",
            method: .post,
            body: ["refreshToken": refreshToken]
        )
    }
    
    static func logout() -> APIEndpoint {
        APIEndpoint(
            path: "/auth/logout",
            method: .post
        )
    }
    
    static func verifyEmail(token: String) -> APIEndpoint {
        APIEndpoint(
            path: "/auth/verify",
            method: .post,
            body: ["token": token]
        )
    }
    
    static func resetPassword(email: String) -> APIEndpoint {
        APIEndpoint(
            path: "/auth/reset-password",
            method: .post,
            body: ["email": email]
        )
    }
    
    // MARK: - Account
    
    static func getAccount() -> APIEndpoint {
        APIEndpoint(path: "/account")
    }
    
    static func updateAccount(updates: [String: Any]) -> APIEndpoint {
        APIEndpoint(
            path: "/account",
            method: .put,
            body: updates
        )
    }
    
    static func getAccountHierarchy() -> APIEndpoint {
        APIEndpoint(path: "/account/hierarchy")
    }
    
    static func switchAccount(accountId: String) -> APIEndpoint {
        APIEndpoint(
            path: "/account/switch",
            method: .post,
            body: ["accountId": accountId]
        )
    }
    
    // MARK: - Sources
    
    static func getSources() -> APIEndpoint {
        APIEndpoint(path: "/sources")
    }
    
    static func getSource(id: String) -> APIEndpoint {
        APIEndpoint(path: "/sources/\(id)")
    }
    
    static func createSource(source: [String: Any]) -> APIEndpoint {
        APIEndpoint(
            path: "/sources",
            method: .post,
            body: source
        )
    }
    
    static func updateSource(id: String, updates: [String: Any]) -> APIEndpoint {
        APIEndpoint(
            path: "/sources/\(id)",
            method: .put,
            body: updates
        )
    }
    
    static func deleteSource(id: String) -> APIEndpoint {
        APIEndpoint(
            path: "/sources/\(id)",
            method: .delete
        )
    }
    
    static func testSource(id: String) -> APIEndpoint {
        APIEndpoint(
            path: "/sources/\(id)/test",
            method: .post
        )
    }
    
    static func syncSource(id: String) -> APIEndpoint {
        APIEndpoint(
            path: "/sources/\(id)/sync",
            method: .post
        )
    }
    
    // MARK: - Jobs
    
    static func getJobs() -> APIEndpoint {
        APIEndpoint(path: "/jobs")
    }
    
    static func getJob(id: String) -> APIEndpoint {
        APIEndpoint(path: "/jobs/\(id)")
    }
    
    static func createJob(job: [String: Any]) -> APIEndpoint {
        APIEndpoint(
            path: "/jobs",
            method: .post,
            body: job
        )
    }
    
    static func updateJob(id: String, updates: [String: Any]) -> APIEndpoint {
        APIEndpoint(
            path: "/jobs/\(id)",
            method: .put,
            body: updates
        )
    }
    
    static func deleteJob(id: String) -> APIEndpoint {
        APIEndpoint(
            path: "/jobs/\(id)",
            method: .delete
        )
    }
    
    static func runJob(id: String) -> APIEndpoint {
        APIEndpoint(
            path: "/jobs/\(id)/run",
            method: .post
        )
    }
    
    // MARK: - Data
    
    static func listData(sourceId: String? = nil, limit: Int = 50, offset: Int = 0) -> APIEndpoint {
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "limit", value: "\(limit)"),
            URLQueryItem(name: "offset", value: "\(offset)")
        ]
        
        if let sourceId = sourceId {
            queryItems.append(URLQueryItem(name: "sourceId", value: sourceId))
        }
        
        return APIEndpoint(
            path: "/data",
            queryItems: queryItems
        )
    }
    
    static func searchData(query: String, sourceId: String? = nil) -> APIEndpoint {
        var queryItems = [URLQueryItem(name: "q", value: query)]
        
        if let sourceId = sourceId {
            queryItems.append(URLQueryItem(name: "sourceId", value: sourceId))
        }
        
        return APIEndpoint(
            path: "/data/search",
            queryItems: queryItems
        )
    }
    
    static func downloadData(fileId: String) -> APIEndpoint {
        APIEndpoint(path: "/data/download/\(fileId)")
    }
    
    // MARK: - Activity
    
    static func getActivity(limit: Int = 50, offset: Int = 0) -> APIEndpoint {
        APIEndpoint(
            path: "/activity",
            queryItems: [
                URLQueryItem(name: "limit", value: "\(limit)"),
                URLQueryItem(name: "offset", value: "\(offset)")
            ]
        )
    }
    
    // MARK: - Integrations
    
    static func getAvailableIntegrations() -> APIEndpoint {
        APIEndpoint(path: "/integrations/available")
    }
    
    static func getIntegration(type: String) -> APIEndpoint {
        APIEndpoint(path: "/integrations/\(type)")
    }
    
    // MARK: - System
    
    static func healthCheck() -> APIEndpoint {
        APIEndpoint(path: "/system/health")
    }
    
    // MARK: - Billing
    
    static func getBillingInfo() -> APIEndpoint {
        APIEndpoint(path: "/billing/customer")
    }
    
    static func getSubscriptions() -> APIEndpoint {
        APIEndpoint(path: "/billing/subscriptions")
    }
    
    static func createPortalSession() -> APIEndpoint {
        APIEndpoint(
            path: "/billing/portal",
            method: .post
        )
    }
    
    static func getInvoices() -> APIEndpoint {
        APIEndpoint(path: "/billing/invoices")
    }
}

// Helper extension to make dictionaries encodable
extension Dictionary: Encodable where Key == String, Value == Any {
    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        
        for (key, value) in self {
            let codingKey = CodingKeys(stringValue: key)!
            
            switch value {
            case let bool as Bool:
                try container.encode(bool, forKey: codingKey)
            case let int as Int:
                try container.encode(int, forKey: codingKey)
            case let double as Double:
                try container.encode(double, forKey: codingKey)
            case let string as String:
                try container.encode(string, forKey: codingKey)
            case let array as [Any]:
                try container.encode(array.map { "\($0)" }, forKey: codingKey)
            case let dict as [String: Any]:
                try container.encode(dict, forKey: codingKey)
            default:
                try container.encode("\(value)", forKey: codingKey)
            }
        }
    }
    
    struct CodingKeys: CodingKey {
        var stringValue: String
        
        init?(stringValue: String) {
            self.stringValue = stringValue
        }
        
        var intValue: Int? { nil }
        
        init?(intValue: Int) {
            return nil
        }
    }
}