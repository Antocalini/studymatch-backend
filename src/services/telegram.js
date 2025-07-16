// src/services/telegram.js (Updated to use tdl)
import tdl from 'tdl'
import { getTdjson } from 'prebuilt-tdlib'
import dotenv from 'dotenv';

dotenv.config();

// Configure tdl to use the pre-built TDLib library
// This simplifies setup as you don't need to compile TDLib yourself
tdl.configure({ tdjson: getTdjson() })

const client = tdl.createClient({
  apiId: parseInt(process.env.TELEGRAM_API_ID),
  apiHash: process.env.TELEGRAM_API_HASH,
  databaseDirectory: './tdlib_database_tdl', // Use a different directory for tdl
  filesDirectory: './tdlib_files_tdl',      // Use a different directory for tdl
  // Other options for tdl:
  // logVerbosityLevel: 1, // Uncomment for more detailed TDLib logs
  // useTestDc: true // Uncomment to connect to Telegram's test servers
});

// Handle errors from TDLib
client.on('error', console.error);

// Optional: Listen for TDLib updates (for debugging or advanced features)
client.on('update', (update) => {
  // console.log('Received TDLib update:', update); // Uncomment to see all updates
  if (update._ === 'updateAuthorizationState' && update.authorizationState._ === 'authorizationStateReady') {
    console.log('tdl: Logged into Telegram successfully!');
  } else if (update._ === 'updateAuthorizationState') {
    console.log('tdl Auth State:', update.authorizationState._);
  }
});

/**
 * Creates a new basic Telegram group and generates an invite link.
 * @param {string} groupName - The name for the new Telegram group.
 * @returns {Promise<{chatId: string, inviteLink: string | null}>} - The ID of the created chat and its invite link.
 */
async function createTelegramGroup(groupName) {
  try {
    console.log(`[Telegram Service] Attempting to create Telegram group: "${groupName}" using tdl`);

    // Create the basic group
    const createResponse = await client.invoke({
      _: 'createNewBasicGroupChat',
      title: groupName,
      user_ids: [], // No initial members added programmatically
    });

    if (createResponse._ !== 'chat' || !createResponse.id) {
      console.error('[Telegram Service] Unexpected tdl response for group creation:', createResponse);
      throw new Error('Failed to create Telegram group: Unexpected API response or missing chat ID.');
    }

    const chatId = createResponse.id;
    console.log(`[Telegram Service] Basic group created. Chat ID: ${chatId}`);

    // Now, get an invite link for the newly created chat
    const inviteLinkResponse = await client.invoke({
        _: 'createChatInviteLink',
        chat_id: chatId,
        member_limit: 0, // No limit
        creates_join_request: false, // Users join directly
    });

    if (inviteLinkResponse._ === 'chatInviteLink') {
        console.log(`[Telegram Service] Invite link generated for chat ${chatId}: ${inviteLinkResponse.invite_link}`);
        return {
            chatId: String(chatId), // Ensure it's a string
            inviteLink: inviteLinkResponse.invite_link // Note: tdl returns invite_link, not inviteLink
        };
    } else if (inviteLinkResponse.error) {
        console.error('[Telegram Service] Error creating invite link:', inviteLinkResponse.error);
        throw new Error(`Telegram API Error creating invite link: ${inviteLinkResponse.error.message}`);
    } else {
        console.warn('[Telegram Service] Unexpected tdl response for invite link creation:', inviteLinkResponse);
        return {
            chatId: String(chatId),
            inviteLink: null
        };
    }

  } catch (error) {
    console.error('[Telegram Service] Caught error in createTelegramGroup:', error.message);
    throw error;
  }
}

// Ensure tdl client is ready and authenticated (run once on server startup)
async function startTelegramClient() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN is not configured in .env. Cannot log in as bot.");
    throw new Error("TELEGRAM_BOT_TOKEN is missing.");
  }

  try {
    console.log('[tdl Init] Logging in as bot...');
    // Log in using the bot token
    await client.loginAsBot(botToken);
    console.log('tdl client initialized and logged in as bot.');
  } catch (error) {
    console.error('Failed to initialize tdl client or log in as bot:', error);
    // You might want to gracefully shut down the app or retry
    throw error;
  }
}

export {
  createTelegramGroup,
  startTelegramClient // Renamed from startAirgram for clarity
};