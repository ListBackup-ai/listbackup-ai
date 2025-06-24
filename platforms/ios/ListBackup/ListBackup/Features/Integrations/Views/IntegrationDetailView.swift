//
//  IntegrationDetailView.swift
//  ListBackup
//
//  Shows detailed information about an integration
//

import SwiftUI

struct IntegrationDetailView: View {
    let integration: Integration
    @Environment(\.dismiss) var dismiss
    @State private var showAddSource = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                headerSection
                
                // Description
                descriptionSection
                
                // Features
                featuresSection
                
                // Supported Data Types
                dataTypesSection
                
                // Requirements
                requirementsSection
                
                // Action Button
                actionButton
            }
            .padding()
        }
        .navigationTitle(integration.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Done") {
                    dismiss()
                }
            }
        }
        .sheet(isPresented: $showAddSource) {
            NavigationStack {
                AddSourceView()
            }
        }
    }
    
    // MARK: - Sections
    
    private var headerSection: some View {
        HStack(spacing: 20) {
            // Icon
            RoundedRectangle(cornerRadius: 20)
                .fill(
                    LinearGradient(
                        colors: [
                            Color(hex: integration.displayColor).opacity(0.8),
                            Color(hex: integration.displayColor)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 80, height: 80)
                .overlay(
                    Image(systemName: integration.iconSystemName)
                        .font(.largeTitle)
                        .foregroundColor(.white)
                )
            
            VStack(alignment: .leading, spacing: 8) {
                Text(integration.name)
                    .font(.title2)
                    .fontWeight(.bold)
                
                HStack {
                    Text(integration.type.uppercased())
                        .font(.caption)
                        .fontWeight(.medium)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.secondary.opacity(0.2))
                        .cornerRadius(6)
                    
                    if integration.isPremium {
                        Label("Premium", systemImage: "star.fill")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }
            }
            
            Spacer()
        }
    }
    
    private var descriptionSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("About")
                .font(.headline)
            
            Text(integration.description)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    
    private var featuresSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Features")
                .font(.headline)
            
            VStack(alignment: .leading, spacing: 8) {
                ForEach(integration.features, id: \.self) { feature in
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.caption)
                        
                        Text(feature)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    
    private var dataTypesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Supported Data Types")
                .font(.headline)
            
            FlowLayout(spacing: 8) {
                ForEach(integration.supportedDataTypes, id: \.self) { dataType in
                    DataTypeChip(name: dataType)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    
    private var requirementsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Requirements")
                .font(.headline)
            
            VStack(alignment: .leading, spacing: 16) {
                ForEach(integration.requiredFields, id: \.key) { field in
                    RequirementRow(field: field)
                }
            }
            .padding()
            .background(Color(UIColor.secondarySystemBackground))
            .cornerRadius(12)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    
    private var actionButton: some View {
        Button {
            showAddSource = true
        } label: {
            HStack {
                Image(systemName: "plus.circle.fill")
                Text("Connect \(integration.name)")
                    .fontWeight(.medium)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color(hex: integration.displayColor))
            .foregroundColor(.white)
            .cornerRadius(12)
        }
        .disabled(!integration.isAvailable)
        .opacity(integration.isAvailable ? 1 : 0.6)
    }
}

// MARK: - Supporting Views

struct DataTypeChip: View {
    let name: String
    
    var body: some View {
        Text(name.capitalized)
            .font(.caption)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color(UIColor.tertiarySystemBackground))
            .cornerRadius(20)
    }
}

struct RequirementRow: View {
    let field: IntegrationField
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: iconForFieldType(field.type))
                    .foregroundColor(.secondary)
                    .frame(width: 20)
                
                Text(field.label)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if field.required {
                    Text("Required")
                        .font(.caption2)
                        .foregroundColor(.orange)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.orange.opacity(0.2))
                        .cornerRadius(4)
                }
                
                Spacer()
            }
            
            if let helpText = field.helpText {
                Text(helpText)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.leading, 28)
            }
        }
    }
    
    private func iconForFieldType(_ type: IntegrationField.FieldType) -> String {
        switch type {
        case .text:
            return "text.alignleft"
        case .password:
            return "lock"
        case .email:
            return "envelope"
        case .url:
            return "link"
        case .select:
            return "list.bullet"
        case .oauth:
            return "key.fill"
        }
    }
}

// MARK: - Flow Layout

struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(
            in: proposal.replacingUnspecifiedDimensions().width,
            subviews: subviews,
            spacing: spacing
        )
        return result.size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(
            in: bounds.width,
            subviews: subviews,
            spacing: spacing
        )
        
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: result.positions[index].x + bounds.minX,
                                     y: result.positions[index].y + bounds.minY),
                         proposal: .unspecified)
        }
    }
    
    struct FlowResult {
        let size: CGSize
        let positions: [CGPoint]
        
        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var currentX: CGFloat = 0
            var currentY: CGFloat = 0
            var lineHeight: CGFloat = 0
            var maxX: CGFloat = 0
            var positions: [CGPoint] = []
            
            for subview in subviews {
                let viewSize = subview.sizeThatFits(.unspecified)
                
                if currentX + viewSize.width > maxWidth, currentX > 0 {
                    currentX = 0
                    currentY += lineHeight + spacing
                    lineHeight = 0
                }
                
                positions.append(CGPoint(x: currentX, y: currentY))
                
                currentX += viewSize.width + spacing
                maxX = max(maxX, currentX)
                lineHeight = max(lineHeight, viewSize.height)
            }
            
            self.size = CGSize(width: maxX - spacing, height: currentY + lineHeight)
            self.positions = positions
        }
    }
}

#Preview {
    NavigationStack {
        IntegrationDetailView(
            integration: Integration(
                id: "keap",
                name: "Keap",
                type: "keap",
                description: "Connect your Keap CRM to backup contacts, orders, and more.",
                icon: nil,
                color: "#FF6900",
                features: [
                    "Real-time data sync",
                    "Automated backups",
                    "Full contact history",
                    "Order and invoice data",
                    "Custom field support"
                ],
                requiredFields: [
                    IntegrationField(
                        key: "apiKey",
                        label: "API Key",
                        type: .password,
                        required: true,
                        placeholder: "Your Keap API key",
                        helpText: "Found in Keap under API Settings"
                    )
                ],
                supportedDataTypes: ["contacts", "orders", "invoices", "products", "notes"],
                isAvailable: true,
                isPremium: false
            )
        )
    }
}