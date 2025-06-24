//
//  JobsListView.swift
//  ListBackup
//
//  Created on 6/14/2025.
//

import SwiftUI

struct JobsListView: View {
    var body: some View {
        NavigationStack {
            VStack {
                Spacer()
                
                Image(systemName: "clock.arrow.circlepath")
                    .font(.system(size: 60))
                    .foregroundColor(.blue)
                    .padding(.bottom, 20)
                
                Text("Coming soon")
                    .font(.title2)
                    .foregroundColor(.secondary)
                
                Text("Your backup jobs will appear here")
                    .font(.footnote)
                    .foregroundColor(.secondary)
                    .padding(.top, 4)
                
                Spacer()
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(UIColor.systemGroupedBackground))
            .navigationTitle("Backup Jobs")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

#Preview {
    JobsListView()
}