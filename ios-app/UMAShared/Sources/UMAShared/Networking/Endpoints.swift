// Endpoints.swift — typed API endpoint definitions

import Foundation

public enum UMAEndpoint: Sendable {
    case patientStore
    case extract
    case chat
    case stream
    case requestOTP
    case verifyOTP
    case session
    case logout
    case healthKitSync

    #if DEBUG && targetEnvironment(simulator)
    private static let baseURL = URL(string: "http://localhost:3000/api/")!
    #else
    private static let baseURL = URL(string: "https://uma.sohamkakra.com/api/")!
    #endif

    public var url: URL {
        switch self {
        case .patientStore:
            return Self.baseURL.appendingPathComponent("patient-store")
        case .extract:
            return Self.baseURL.appendingPathComponent("extract")
        case .chat:
            return Self.baseURL.appendingPathComponent("chat")
        case .stream:
            return Self.baseURL.appendingPathComponent("patient-store/stream")
        case .requestOTP:
            return Self.baseURL.appendingPathComponent("auth/request-otp")
        case .verifyOTP:
            return Self.baseURL.appendingPathComponent("auth/verify-otp")
        case .session:
            return Self.baseURL.appendingPathComponent("auth/session")
        case .logout:
            return Self.baseURL.appendingPathComponent("auth/logout")
        case .healthKitSync:
            return Self.baseURL.appendingPathComponent("healthkit/sync")
        }
    }

    public var method: String {
        switch self {
        case .patientStore, .stream, .session:
            return "GET"
        case .extract, .chat, .requestOTP, .verifyOTP, .logout, .healthKitSync:
            return "POST"
        }
    }
}

// MARK: - Request/Response types

public struct ChatRequest: Codable, Sendable {
    public let question: String
    public let messages: [ChatMessage]

    public init(message: String, history: [ChatMessage], store: PatientStore? = nil) {
        self.question = message
        self.messages = history
    }
}

public struct ExtractResponse: Codable, Sendable {
    public let doc: ExtractedDoc
    public let extractionCost: ExtractionCost?
}

public struct PatientStoreResponse: Codable, Sendable {
    public let ok: Bool
    public let store: PatientStore?
}

public struct ExtractionCost: Codable, Sendable {
    public let inputTokens: Int?
    public let outputTokens: Int?
    public let usd: Double?
    public let model: String?
    public let extractorSource: String?
}

public struct OTPRequest: Codable, Sendable {
    public let identifier: String
    public let phoneCountryCode: String?

    public init(identifier: String, phoneCountryCode: String? = nil) {
        self.identifier = identifier
        self.phoneCountryCode = phoneCountryCode
    }
}

public struct OTPVerifyRequest: Codable, Sendable {
    public let identifier: String
    public let code: String
    public let acceptedTermsVersion: String

    public init(identifier: String, code: String) {
        self.identifier = identifier
        self.code = code
        self.acceptedTermsVersion = "2026-07-10"
    }
}

public struct APIResponse: Codable, Sendable {
    public let ok: Bool
    public let error: String?
    public let channel: String?
    public let devOtp: String?
    /// Session token returned by verify-otp when X-UMA-Client: ios is sent.
    public let token: String?
}

public struct SessionResponse: Codable, Sendable {
    public let ok: Bool
    public let userId: String?
    public let email: String?
    public let phoneE164: String?
}
