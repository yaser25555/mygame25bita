const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

// Agora Configuration
const appID = '852ff5f55a7a49b081b799358f2fc329';
const appCertificate = '007eJxTYHj81KRE7GjOapG24m3XujuW5Tm+dfh/0iag486n1PnauvIKDBamRmlppmmmponmiSaWSQYWhknmlpbGphZpRmnJxkaW3bciMhoCGRneF09mZWRgZWBkYGIA8RkYAPThHz0=';

// Token expiration time (24 hours)
const expirationTimeInSeconds = 24 * 3600;

// Current timestamp
const currentTimestamp = Math.floor(Date.now() / 1000);

// Privilege expiration time
const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

function generateToken(channelName, uid) {
    try {
        // Build token with uid
        const token = RtcTokenBuilder.buildTokenWithUid(
            appID,
            appCertificate,
            channelName,
            uid,
            RtcRole.PUBLISHER,
            privilegeExpiredTs
        );
        
        console.log('🎤 Generated Agora token for channel:', channelName, 'UID:', uid);
        return token;
    } catch (error) {
        console.error('❌ Error generating Agora token:', error);
        return null;
    }
}

function generateTokenWithAccount(channelName, account) {
    try {
        // Build token with account
        const token = RtcTokenBuilder.buildTokenWithAccount(
            appID,
            appCertificate,
            channelName,
            account,
            RtcRole.PUBLISHER,
            privilegeExpiredTs
        );
        
        console.log('🎤 Generated Agora token for channel:', channelName, 'Account:', account);
        return token;
    } catch (error) {
        console.error('❌ Error generating Agora token:', error);
        return null;
    }
}

module.exports = {
    generateToken,
    generateTokenWithAccount,
    appID
}; 