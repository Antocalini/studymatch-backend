// src/services/telegram.js (Updated for user authentication)
import tdl from 'tdl'
import { getTdjson } from 'prebuilt-tdlib'
import dotenv from 'dotenv';

dotenv.config();

// Configure tdl to use the pre-built TDLib library
tdl.configure({ tdjson: getTdjson() })

const client = tdl.createClient({
  apiId: parseInt(process.env.TELEGRAM_API_ID),
  apiHash: process.env.TELEGRAM_API_HASH,
  databaseDirectory: './tdlib_database_tdl',
  filesDirectory: './tdlib_files_tdl',
  logVerbosityLevel: 1, // Enable for debugging
});

// Handle errors from TDLib
client.on('error', console.error);

// Listen for TDLib updates
client.on('update', (update) => {
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

    // Create the basic group (this works with user authentication)
    const createResponse = await client.invoke({
      _: 'createNewBasicGroupChat',
      title: groupName,
      user_ids: [], // No initial members
    });

    console.log('[Telegram Service] Create response:', createResponse);

    // Handle the correct response structure from tdl
    let chatId;
    if (createResponse._ === 'createdBasicGroupChat' && createResponse.chat_id) {
      chatId = createResponse.chat_id; // Keep the original ID (negative for groups)
    } else if (createResponse._ === 'chat' && createResponse.id) {
      chatId = createResponse.id;
    } else {
      console.error('[Telegram Service] Unexpected tdl response for group creation:', createResponse);
      throw new Error('Failed to create Telegram group: Unexpected API response or missing chat ID.');
    }

    console.log(`[Telegram Service] Basic group created. Chat ID: ${chatId}`);

    // Generate invite link
    console.log(`[Telegram Service] Creating invite link for chat ID: ${chatId}`);
    
    const inviteLinkResponse = await client.invoke({
      _: 'createChatInviteLink',
      chat_id: chatId, // Use the original negative ID
      name: `${groupName} Invite`, // Optional: name for the invite link
      member_limit: 0, // No limit
      creates_join_request: false, // Users join directly
    });

    console.log(`[Telegram Service] Invite link response:`, inviteLinkResponse);

    if (inviteLinkResponse._ === 'chatInviteLink') {
      console.log(`[Telegram Service] Invite link generated for chat ${chatId}: ${inviteLinkResponse.invite_link}`);
      return {
        chatId: String(chatId), // Keep the original negative ID as string
        inviteLink: inviteLinkResponse.invite_link
      };
    } else {
      console.warn('[Telegram Service] Unexpected response for invite link creation:', inviteLinkResponse);
      return {
        chatId: String(chatId), // Keep the original negative ID as string
        inviteLink: null
      };
    }

  } catch (error) {
    console.error('[Telegram Service] Caught error in createTelegramGroup:', error.message);
    throw error;
  }
}

// Initialize client with user authentication (not bot)
async function startTelegramClient() {
  try {
    console.log('[tdl Init] Starting user authentication...');
    
    // For user authentication, use client.login() 
    // By default, this will prompt for phone number and verification code in console
    await client.login();
    
    console.log('tdl client initialized and logged in as user.');
  } catch (error) {
    console.error('Failed to initialize tdl client or log in as user:', error);
    throw error;
  }
}

export {
  createTelegramGroup,
  startTelegramClient
};