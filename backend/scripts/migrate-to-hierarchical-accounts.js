#!/usr/bin/env node

/**
 * Migration Script: Convert Single-Account Users to Hierarchical Account System
 * 
 * This script migrates existing v1 users to the new hierarchical account system:
 * 1. Creates USER_ACCOUNTS table entries for existing user-account relationships
 * 2. Updates Account records to include hierarchical fields
 * 3. Preserves existing permissions as "Owner" role
 * 
 * Usage: node migrate-to-hierarchical-accounts.js --stage main --dry-run
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configuration
const STAGE = process.argv.includes('--stage') ? process.argv[process.argv.indexOf('--stage') + 1] : 'main';
const DRY_RUN = process.argv.includes('--dry-run');

const TABLE_PREFIX = `listbackup-${STAGE}`;
const USERS_TABLE = `${TABLE_PREFIX}-users`;
const ACCOUNTS_TABLE = `${TABLE_PREFIX}-accounts`;
const USER_ACCOUNTS_TABLE = `${TABLE_PREFIX}-user-accounts`;

// AWS Setup
AWS.config.update({ region: 'us-east-1' });
const dynamoDB = new AWS.DynamoDB.DocumentClient();

console.log(`🚀 Starting hierarchical account migration for stage: ${STAGE}`);
console.log(`📋 Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`);
console.log('');

// Default permissions for Owner role
const OWNER_PERMISSIONS = {
    canCreateSubAccounts: true,
    canInviteUsers: true,
    canManageIntegrations: true,
    canViewAllData: true,
    canManageBilling: true,
    canDeleteAccount: true,
    canModifySettings: true
};

async function scanTable(tableName) {
    console.log(`📖 Scanning table: ${tableName}`);
    
    const items = [];
    let lastEvaluatedKey = null;
    
    do {
        const params = {
            TableName: tableName,
            ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
        };
        
        const result = await dynamoDB.scan(params).promise();
        items.push(...result.Items);
        lastEvaluatedKey = result.LastEvaluatedKey;
        
        console.log(`   Found ${result.Items.length} items (total: ${items.length})`);
    } while (lastEvaluatedKey);
    
    return items;
}

async function createUserAccountsTable() {
    console.log(`🔧 Creating USER_ACCOUNTS table: ${USER_ACCOUNTS_TABLE}`);
    
    if (DRY_RUN) {
        console.log('   [DRY RUN] Would create table');
        return;
    }
    
    const tableParams = {
        TableName: USER_ACCOUNTS_TABLE,
        KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'accountId', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'accountId', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST',
        Tags: [
            { Key: 'Environment', Value: STAGE },
            { Key: 'Service', Value: 'listbackup-api' }
        ]
    };
    
    try {
        await new AWS.DynamoDB().createTable(tableParams).promise();
        console.log('   ✅ Table created successfully');
        
        // Wait for table to be active
        console.log('   ⏳ Waiting for table to become active...');
        await new AWS.DynamoDB().waitFor('tableExists', { TableName: USER_ACCOUNTS_TABLE }).promise();
        console.log('   ✅ Table is now active');
    } catch (error) {
        if (error.code === 'ResourceInUseException') {
            console.log('   ℹ️  Table already exists');
        } else {
            throw error;
        }
    }
}

async function migrateUsers() {
    console.log('👥 Migrating users...');
    
    const users = await scanTable(USERS_TABLE);
    const migrationResults = {
        processed: 0,
        migrated: 0,
        skipped: 0,
        errors: 0
    };
    
    for (const user of users) {
        migrationResults.processed++;
        
        try {
            // Check if user has accountId (old single-account system)
            if (!user.accountId) {
                console.log(`   ⚠️  Skipping user ${user.userId}: No accountId found`);
                migrationResults.skipped++;
                continue;
            }
            
            // Ensure proper prefixes
            const userId = user.userId.startsWith('user:') ? user.userId : `user:${user.userId}`;
            const accountId = user.accountId.startsWith('account:') ? user.accountId : `account:${user.accountId}`;
            
            // Check if relationship already exists
            const existingRelationship = await checkUserAccountExists(userId, accountId);
            if (existingRelationship) {
                console.log(`   ⏭️  Skipping user ${userId}: Relationship already exists`);
                migrationResults.skipped++;
                continue;
            }
            
            // Create user-account relationship
            const userAccount = {
                userId: userId,
                accountId: accountId,
                role: user.role || 'Owner',
                status: 'Active',
                permissions: OWNER_PERMISSIONS,
                linkedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            if (!DRY_RUN) {
                await dynamoDB.put({
                    TableName: USER_ACCOUNTS_TABLE,
                    Item: userAccount
                }).promise();
            }
            
            console.log(`   ✅ Migrated user ${userId} -> ${accountId}`);
            migrationResults.migrated++;
            
        } catch (error) {
            console.error(`   ❌ Error migrating user ${user.userId}:`, error.message);
            migrationResults.errors++;
        }
    }
    
    console.log('');
    console.log('👥 User Migration Results:');
    console.log(`   Processed: ${migrationResults.processed}`);
    console.log(`   Migrated: ${migrationResults.migrated}`);
    console.log(`   Skipped: ${migrationResults.skipped}`);
    console.log(`   Errors: ${migrationResults.errors}`);
    
    return migrationResults;
}

async function migrateAccounts() {
    console.log('🏢 Migrating accounts to hierarchical structure...');
    
    const accounts = await scanTable(ACCOUNTS_TABLE);
    const migrationResults = {
        processed: 0,
        migrated: 0,
        skipped: 0,
        errors: 0
    };
    
    for (const account of accounts) {
        migrationResults.processed++;
        
        try {
            // Check if account already has hierarchical fields
            if (account.accountPath && account.level !== undefined) {
                console.log(`   ⏭️  Skipping account ${account.accountId}: Already hierarchical`);
                migrationResults.skipped++;
                continue;
            }
            
            // Ensure proper prefix
            const accountId = account.accountId.startsWith('account:') ? account.accountId : `account:${account.accountId}`;
            const cleanAccountId = accountId.replace('account:', '');
            
            // Update account with hierarchical fields
            const updateParams = {
                TableName: ACCOUNTS_TABLE,
                Key: { accountId: accountId },
                UpdateExpression: 'SET accountPath = :path, #level = :level, ownerUserId = :ownerId, company = :company, #settings = :settings',
                ExpressionAttributeNames: {
                    '#level': 'level',
                    '#settings': 'settings'
                },
                ExpressionAttributeValues: {
                    ':path': `/${cleanAccountId}`,
                    ':level': 0,
                    ':ownerId': account.userId || account.ownerUserId || 'unknown',
                    ':company': account.company || account.name || 'Unknown Company',
                    ':settings': {
                        ...account.settings,
                        allowSubAccounts: true,
                        maxSubAccounts: 5,
                        whiteLabel: {
                            enabled: false,
                            logo: '',
                            brandName: ''
                        }
                    }
                }
            };
            
            if (!DRY_RUN) {
                await dynamoDB.update(updateParams).promise();
            }
            
            console.log(`   ✅ Migrated account ${accountId} to hierarchical structure`);
            migrationResults.migrated++;
            
        } catch (error) {
            console.error(`   ❌ Error migrating account ${account.accountId}:`, error.message);
            migrationResults.errors++;
        }
    }
    
    console.log('');
    console.log('🏢 Account Migration Results:');
    console.log(`   Processed: ${migrationResults.processed}`);
    console.log(`   Migrated: ${migrationResults.migrated}`);
    console.log(`   Skipped: ${migrationResults.skipped}`);
    console.log(`   Errors: ${migrationResults.errors}`);
    
    return migrationResults;
}

async function checkUserAccountExists(userId, accountId) {
    try {
        const result = await dynamoDB.get({
            TableName: USER_ACCOUNTS_TABLE,
            Key: { userId, accountId }
        }).promise();
        
        return !!result.Item;
    } catch (error) {
        if (error.code === 'ResourceNotFoundException') {
            return false;
        }
        throw error;
    }
}

async function verifyMigration() {
    console.log('🔍 Verifying migration...');
    
    try {
        const users = await scanTable(USERS_TABLE);
        const userAccounts = await scanTable(USER_ACCOUNTS_TABLE);
        const accounts = await scanTable(ACCOUNTS_TABLE);
        
        console.log(`   Users: ${users.length}`);
        console.log(`   User-Account relationships: ${userAccounts.length}`);
        console.log(`   Accounts: ${accounts.length}`);
        
        // Check for users with accountId that don't have relationships
        const usersWithAccountId = users.filter(u => u.accountId);
        const missingRelationships = [];
        
        for (const user of usersWithAccountId) {
            const userId = user.userId.startsWith('user:') ? user.userId : `user:${user.userId}`;
            const accountId = user.accountId.startsWith('account:') ? user.accountId : `account:${user.accountId}`;
            
            const hasRelationship = userAccounts.some(ua => ua.userId === userId && ua.accountId === accountId);
            if (!hasRelationship) {
                missingRelationships.push({ userId, accountId });
            }
        }
        
        if (missingRelationships.length > 0) {
            console.log(`   ⚠️  Found ${missingRelationships.length} users without proper relationships`);
            missingRelationships.forEach(({ userId, accountId }) => {
                console.log(`      ${userId} -> ${accountId}`);
            });
        } else {
            console.log('   ✅ All users have proper account relationships');
        }
        
    } catch (error) {
        console.error('   ❌ Error during verification:', error.message);
    }
}

async function main() {
    try {
        console.log('🎯 Hierarchical Account Migration Starting...');
        console.log('');
        
        // Step 1: Create USER_ACCOUNTS table
        await createUserAccountsTable();
        console.log('');
        
        // Step 2: Migrate users to create relationships
        const userResults = await migrateUsers();
        console.log('');
        
        // Step 3: Migrate accounts to hierarchical structure
        const accountResults = await migrateAccounts();
        console.log('');
        
        // Step 4: Verify migration
        await verifyMigration();
        console.log('');
        
        // Summary
        console.log('🎉 Migration Summary:');
        console.log(`   Users migrated: ${userResults.migrated}`);
        console.log(`   Accounts migrated: ${accountResults.migrated}`);
        console.log(`   Total errors: ${userResults.errors + accountResults.errors}`);
        
        if (DRY_RUN) {
            console.log('');
            console.log('💡 This was a DRY RUN. To execute the migration, run without --dry-run flag');
        }
        
    } catch (error) {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
main();