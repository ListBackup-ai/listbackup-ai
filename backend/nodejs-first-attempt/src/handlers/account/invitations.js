const AWS = require('aws-sdk');
const { extractAuthContext } = require('../../utils/auth');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES({ region: 'us-east-1' });

const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE;
const USERS_ACCOUNTS_TABLE = process.env.USERS_ACCOUNTS_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;
const SES_SOURCE_EMAIL = process.env.SES_SOURCE_EMAIL;

/**
 * Invite a user to join an account
 */
exports.inviteUser = async (event) => {
    console.log('Invite user event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { email, role = 'Viewer', permissions = {} } = JSON.parse(event.body || '{}');
        
        if (!email) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Email is required' })
            };
        }
        
        if (!['Owner', 'Manager', 'Viewer'].includes(role)) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Invalid role. Must be Owner, Manager, or Viewer' })
            };
        }
        
        // Check if user has permission to invite users
        const userAccountResult = await dynamodb.get({
            TableName: USERS_ACCOUNTS_TABLE,
            Key: { userId, accountId }
        }).promise();
        
        if (!userAccountResult.Item || 
            !['Owner', 'Manager'].includes(userAccountResult.Item.role) ||
            !userAccountResult.Item.permissions?.canInviteUsers) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Insufficient permissions to invite users' })
            };
        }
        
        // Check if user is already associated with this account
        const existingUserQuery = {
            TableName: USERS_TABLE,
            IndexName: 'emailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': email }
        };
        
        const existingUserResult = await dynamodb.query(existingUserQuery).promise();
        
        if (existingUserResult.Items.length > 0) {
            const existingUserId = existingUserResult.Items[0].userId;
            
            // Check if already linked to this account
            const existingLinkResult = await dynamodb.get({
                TableName: USERS_ACCOUNTS_TABLE,
                Key: { userId: existingUserId, accountId }
            }).promise();
            
            if (existingLinkResult.Item) {
                return {
                    statusCode: 409,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({ error: 'User is already associated with this account' })
                };
            }
        }
        
        // Remove any existing invitations for this email/account combination
        const existingInviteQuery = {
            TableName: USERS_ACCOUNTS_TABLE,
            IndexName: 'emailIndex',
            KeyConditionExpression: 'email = :email',
            FilterExpression: 'accountId = :accountId AND #status = :status',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { 
                ':email': email,
                ':accountId': accountId,
                ':status': 'Invited'
            }
        };
        
        const existingInvites = await dynamodb.query(existingInviteQuery).promise();
        
        for (const invite of existingInvites.Items || []) {
            await dynamodb.delete({
                TableName: USERS_ACCOUNTS_TABLE,
                Key: { userId: invite.userId, accountId: invite.accountId }
            }).promise();
        }
        
        // Generate 6-digit invite code
        const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
        const inviteUserId = `invite-${inviteCode}`;
        
        // Set default permissions based on role
        const defaultPermissions = {
            Owner: {
                canCreateSubAccounts: true,
                canInviteUsers: true,
                canManageIntegrations: true,
                canViewAllData: true
            },
            Manager: {
                canCreateSubAccounts: false,
                canInviteUsers: true,
                canManageIntegrations: true,
                canViewAllData: true
            },
            Viewer: {
                canCreateSubAccounts: false,
                canInviteUsers: false,
                canManageIntegrations: false,
                canViewAllData: false
            }
        };
        
        const finalPermissions = { ...defaultPermissions[role], ...permissions };
        
        // Create invitation record
        const invitation = {
            userId: inviteUserId,
            accountId,
            email,
            role,
            status: 'Invited',
            permissions: finalPermissions,
            inviteCode,
            invitedBy: userId,
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            createdAt: Date.now()
        };
        
        await dynamodb.put({
            TableName: USERS_ACCOUNTS_TABLE,
            Item: invitation
        }).promise();
        
        // Get account and inviter details for email
        const [accountResult, inviterResult] = await Promise.all([
            dynamodb.get({ TableName: ACCOUNTS_TABLE, Key: { accountId } }).promise(),
            dynamodb.get({ TableName: USERS_TABLE, Key: { userId } }).promise()
        ]);
        
        const account = accountResult.Item;
        const inviter = inviterResult.Item;
        
        // Send invitation email
        await sendInvitationEmail(email, inviteCode, account, inviter, event);
        
        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                message: 'Invitation sent successfully',
                inviteCode,
                email,
                role,
                expiresAt: invitation.expiresAt
            })
        };
        
    } catch (error) {
        console.error('Error inviting user:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Accept an invitation using invite code
 */
exports.acceptInvitation = async (event) => {
    console.log('Accept invitation event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId } = extractAuthContext(event);
        const { inviteCode } = JSON.parse(event.body || '{}');
        
        if (!inviteCode) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Invite code is required' })
            };
        }
        
        // Find the invitation
        const inviteUserId = `invite-${inviteCode}`;
        const scanParams = {
            TableName: USERS_ACCOUNTS_TABLE,
            FilterExpression: 'userId = :inviteUserId AND #status = :status AND expiresAt > :now',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':inviteUserId': inviteUserId,
                ':status': 'Invited',
                ':now': Date.now()
            }
        };
        
        const inviteResult = await dynamodb.scan(scanParams).promise();
        
        if (!inviteResult.Items || inviteResult.Items.length === 0) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Invalid or expired invite code' })
            };
        }
        
        const invitation = inviteResult.Items[0];
        
        // Verify the user's email matches the invitation
        const userResult = await dynamodb.get({
            TableName: USERS_TABLE,
            Key: { userId }
        }).promise();
        
        if (!userResult.Item || userResult.Item.email !== invitation.email) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Email does not match invitation' })
            };
        }
        
        // Check if user is already linked to this account
        const existingLinkResult = await dynamodb.get({
            TableName: USERS_ACCOUNTS_TABLE,
            Key: { userId, accountId: invitation.accountId }
        }).promise();
        
        if (existingLinkResult.Item) {
            return {
                statusCode: 409,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Already linked to this account' })
            };
        }
        
        // Create user-account association
        const userAccount = {
            userId,
            accountId: invitation.accountId,
            role: invitation.role,
            status: 'Active',
            permissions: invitation.permissions,
            linkedAt: Date.now()
        };
        
        await dynamodb.put({
            TableName: USERS_ACCOUNTS_TABLE,
            Item: userAccount
        }).promise();
        
        // Delete the invitation
        await dynamodb.delete({
            TableName: USERS_ACCOUNTS_TABLE,
            Key: { userId: inviteUserId, accountId: invitation.accountId }
        }).promise();
        
        // Get account details for response
        const accountResult = await dynamodb.get({
            TableName: ACCOUNTS_TABLE,
            Key: { accountId: invitation.accountId }
        }).promise();
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                message: 'Invitation accepted successfully',
                account: accountResult.Item,
                userRole: userAccount.role,
                userPermissions: userAccount.permissions
            })
        };
        
    } catch (error) {
        console.error('Error accepting invitation:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Get pending invitations for an account
 */
exports.getInvitations = async (event) => {
    console.log('Get invitations event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        
        // Check if user has permission to view invitations
        const userAccountResult = await dynamodb.get({
            TableName: USERS_ACCOUNTS_TABLE,
            Key: { userId, accountId }
        }).promise();
        
        if (!userAccountResult.Item || 
            !['Owner', 'Manager'].includes(userAccountResult.Item.role)) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Insufficient permissions to view invitations' })
            };
        }
        
        // Get all pending invitations for this account
        const queryParams = {
            TableName: USERS_ACCOUNTS_TABLE,
            IndexName: 'accountIdIndex',
            KeyConditionExpression: 'accountId = :accountId',
            FilterExpression: '#status = :status AND expiresAt > :now',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':accountId': accountId,
                ':status': 'Invited',
                ':now': Date.now()
            }
        };
        
        const result = await dynamodb.query(queryParams).promise();
        const invitations = result.Items || [];
        
        // Get inviter details for each invitation
        const inviterIds = [...new Set(invitations.map(inv => inv.invitedBy))];
        const inviterDetails = {};
        
        if (inviterIds.length > 0) {
            const batchParams = {
                RequestItems: {
                    [USERS_TABLE]: {
                        Keys: inviterIds.map(id => ({ userId: id }))
                    }
                }
            };
            
            const inviterResult = await dynamodb.batchGet(batchParams).promise();
            (inviterResult.Responses[USERS_TABLE] || []).forEach(user => {
                inviterDetails[user.userId] = user;
            });
        }
        
        // Enhance invitations with inviter details
        const enhancedInvitations = invitations.map(invitation => ({
            ...invitation,
            inviterName: inviterDetails[invitation.invitedBy]?.name || 'Unknown',
            inviterEmail: inviterDetails[invitation.invitedBy]?.email || 'Unknown'
        }));
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(enhancedInvitations)
        };
        
    } catch (error) {
        console.error('Error getting invitations:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Cancel an invitation
 */
exports.cancelInvitation = async (event) => {
    console.log('Cancel invitation event:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, accountId } = extractAuthContext(event);
        const { inviteCode } = JSON.parse(event.body || '{}');
        
        if (!inviteCode) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Invite code is required' })
            };
        }
        
        // Check if user has permission to cancel invitations
        const userAccountResult = await dynamodb.get({
            TableName: USERS_ACCOUNTS_TABLE,
            Key: { userId, accountId }
        }).promise();
        
        if (!userAccountResult.Item || 
            !['Owner', 'Manager'].includes(userAccountResult.Item.role)) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Insufficient permissions to cancel invitations' })
            };
        }
        
        const inviteUserId = `invite-${inviteCode}`;
        
        // Delete the invitation
        await dynamodb.delete({
            TableName: USERS_ACCOUNTS_TABLE,
            Key: { userId: inviteUserId, accountId }
        }).promise();
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Invitation cancelled successfully' })
        };
        
    } catch (error) {
        console.error('Error cancelling invitation:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

/**
 * Send invitation email
 */
async function sendInvitationEmail(email, inviteCode, account, inviter, event) {
    const origin = event.headers.origin || `https://${event.requestContext.domainName}`;
    const acceptUrl = `${origin}/auth/accept-invitation?code=${inviteCode}`;
    
    const emailParams = {
        Destination: { ToAddresses: [email] },
        Message: {
            Body: {
                Html: {
                    Data: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Account Invitation - ListBackup.ai</title>
                            <style>
                                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                                .header { text-align: center; margin-bottom: 30px; }
                                .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
                                .content { line-height: 1.6; color: #333; }
                                .invite-code { background: #f0f9ff; border: 2px solid #bfdbfe; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                                .code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; font-family: monospace; }
                                .button { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <div class="logo">ListBackup.ai</div>
                                </div>
                                <div class="content">
                                    <h2>You're invited to join ${account.name}</h2>
                                    <p>Hello,</p>
                                    <p>${inviter.name || inviter.email} has invited you to join the account "<strong>${account.name}</strong>" on ListBackup.ai.</p>
                                    
                                    <div class="invite-code">
                                        <p><strong>Your invitation code:</strong></p>
                                        <div class="code">${inviteCode}</div>
                                    </div>
                                    
                                    <p>Click the button below to accept this invitation:</p>
                                    <a href="${acceptUrl}" class="button">Accept Invitation</a>
                                    
                                    <p>Or visit <a href="${origin}/auth/accept-invitation">${origin}/auth/accept-invitation</a> and enter the code manually.</p>
                                    
                                    <p><strong>This invitation will expire in 7 days.</strong></p>
                                </div>
                                <div class="footer">
                                    <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                                    <p>© ${new Date().getFullYear()} ListBackup.ai. All rights reserved.</p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `
                },
                Text: {
                    Data: `You're invited to join ${account.name} on ListBackup.ai. Use invitation code: ${inviteCode}. Visit ${acceptUrl} to accept.`
                }
            },
            Subject: { Data: `Invitation to join ${account.name} - ListBackup.ai` }
        },
        Source: `"ListBackup.ai" <${SES_SOURCE_EMAIL}>`
    };
    
    await ses.sendEmail(emailParams).promise();
    console.log(`Invitation email sent to: ${email}`);
}