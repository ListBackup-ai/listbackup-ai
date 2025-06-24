//
//  APIError.swift
//  ListBackup
//
//  API error types and handling
//

import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case noData
    case decodingError(Error)
    case encodingError(Error)
    case httpError(statusCode: Int)
    case serverError(statusCode: Int)
    case networkError(Error)
    case unauthorized
    case forbidden
    case notFound
    case rateLimited
    case noRefreshToken
    case apiError(message: String)
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid server response"
        case .noData:
            return "No data received"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .encodingError(let error):
            return "Failed to encode request: \(error.localizedDescription)"
        case .httpError(let statusCode):
            return "HTTP error: \(statusCode)"
        case .serverError(let statusCode):
            return "Server error: \(statusCode)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .unauthorized:
            return "Authentication required"
        case .forbidden:
            return "Access denied"
        case .notFound:
            return "Resource not found"
        case .rateLimited:
            return "Rate limit exceeded. Please try again later."
        case .noRefreshToken:
            return "Session expired. Please log in again."
        case .apiError(let message):
            return message
        case .unknown:
            return "An unknown error occurred"
        }
    }
    
    var isRetryable: Bool {
        switch self {
        case .networkError, .serverError, .rateLimited:
            return true
        default:
            return false
        }
    }
    
    var requiresReauthentication: Bool {
        switch self {
        case .unauthorized, .noRefreshToken:
            return true
        default:
            return false
        }
    }
}