//
//  APIClient.swift
//  ListBackup
//
//  API Client bridge for iOS that connects to the shared API client
//

import Foundation
import Combine

/// Main API client for iOS app
@MainActor
class APIClient: ObservableObject {
    static let shared = APIClient()
    
    private let baseURL: String
    private let session: URLSession
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        // Use CloudFlare tunnel for development
        #if DEBUG
        self.baseURL = "https://knitting-par-frankfurt-adjust.trycloudflare.com"
        #else
        self.baseURL = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String 
            ?? "https://api.listbackup.ai"
        #endif
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.waitsForConnectivity = true
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        
        self.session = URLSession(configuration: config)
        
        setupDecoder()
    }
    
    private func setupDecoder() {
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
        
        encoder.keyEncodingStrategy = .convertToSnakeCase
        encoder.dateEncodingStrategy = .iso8601
    }
    
    // MARK: - Request Building
    
    private func buildRequest(for endpoint: APIEndpoint) throws -> URLRequest {
        guard let url = URL(string: baseURL + endpoint.path) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("ListBackup-iOS/1.0", forHTTPHeaderField: "User-Agent")
        
        // Add auth token from Keychain
        if let token = KeychainService.shared.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add body if present
        if let body = endpoint.body {
            request.httpBody = try encoder.encode(body)
        }
        
        // Add query parameters if present
        if let queryItems = endpoint.queryItems {
            var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
            components?.queryItems = queryItems
            request.url = components?.url
        }
        
        return request
    }
    
    // MARK: - Generic Request Method
    
    func request<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T {
        let request = try buildRequest(for: endpoint)
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            // Handle specific status codes
            switch httpResponse.statusCode {
            case 200...299:
                return try decoder.decode(T.self, from: data)
            case 401:
                // Token expired, try to refresh
                try await refreshToken()
                // Retry the original request
                return try await self.request(endpoint)
            case 403:
                throw APIError.forbidden
            case 404:
                throw APIError.notFound
            case 429:
                throw APIError.rateLimited
            case 500...599:
                throw APIError.serverError(statusCode: httpResponse.statusCode)
            default:
                // Try to decode error response
                if let errorResponse = try? decoder.decode(ErrorResponse.self, from: data) {
                    throw APIError.apiError(message: errorResponse.message)
                }
                throw APIError.httpError(statusCode: httpResponse.statusCode)
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError(error)
        }
    }
    
    // MARK: - Token Management
    
    private func refreshToken() async throws {
        guard let refreshToken = KeychainService.shared.getRefreshToken() else {
            throw APIError.noRefreshToken
        }
        
        let endpoint = APIEndpoint.refreshToken(refreshToken: refreshToken)
        let response: TokenResponse = try await request(endpoint)
        
        // Save new tokens
        KeychainService.shared.saveToken(response.accessToken)
        if let newRefreshToken = response.refreshToken {
            KeychainService.shared.saveRefreshToken(newRefreshToken)
        }
    }
    
    // MARK: - File Download
    
    func download(_ endpoint: APIEndpoint) async throws -> (Data, String?) {
        let request = try buildRequest(for: endpoint)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }
        
        // Extract filename from Content-Disposition header if available
        let filename = httpResponse.value(forHTTPHeaderField: "Content-Disposition")
            .flatMap { disposition in
                disposition.components(separatedBy: "filename=")
                    .last?
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                    .trimmingCharacters(in: CharacterSet(charactersIn: "\""))
            }
        
        return (data, filename)
    }
    
    // MARK: - Multipart Upload
    
    func upload<T: Decodable>(_ endpoint: APIEndpoint, fileData: Data, filename: String, mimeType: String) async throws -> T {
        var request = try buildRequest(for: endpoint)
        
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        // Build multipart body
        var body = Data()
        
        // Add file data
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add any additional fields from endpoint body
        if let additionalFields = endpoint.body as? [String: Any] {
            for (key, value) in additionalFields {
                body.append("--\(boundary)\r\n".data(using: .utf8)!)
                body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n".data(using: .utf8)!)
                body.append("\(value)\r\n".data(using: .utf8)!)
            }
        }
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }
        
        return try decoder.decode(T.self, from: data)
    }
}

// MARK: - API Endpoint Definition

struct APIEndpoint {
    let path: String
    let method: HTTPMethod
    let body: Encodable?
    let queryItems: [URLQueryItem]?
    
    init(path: String, method: HTTPMethod = .get, body: Encodable? = nil, queryItems: [URLQueryItem]? = nil) {
        self.path = path
        self.method = method
        self.body = body
        self.queryItems = queryItems
    }
}

// MARK: - HTTP Methods

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
    case patch = "PATCH"
}

// MARK: - Response Models

struct TokenResponse: Decodable {
    let accessToken: String
    let refreshToken: String?
    let expiresIn: Int?
}

struct ErrorResponse: Decodable {
    let message: String
    let code: String?
    let details: [String: Any]?
    
    enum CodingKeys: String, CodingKey {
        case message, code, details
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        message = try container.decode(String.self, forKey: .message)
        code = try container.decodeIfPresent(String.self, forKey: .code)
        details = try container.decodeIfPresent([String: Any].self, forKey: .details)
    }
}