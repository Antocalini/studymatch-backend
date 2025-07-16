// src/services/telegram.js (Updated)
import { Airgram, Auth } from 'airgram';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query) => new Promise(resolve => rl.question(query, resolve));

const airgram = new Airgram({
  apiId: parseInt(process.env.TELEGRAM_API_ID),
  apiHash: process.env.TELEGRAM_API_HASH,
  command: process.env.TDLIB_COMMAND || 'tdlib',
  logVerbosityLevel: 1,
  databaseDirectory: './tdlib_database',
  filesDirectory: './tdlib_files'
});

/**
 * Creates a new basic Telegram group and generates an invite link.
 * Note: Only the bot that creates the group can create the initial invite link easily.
 * If you need to manage multiple invite links or revoke them, you'd extend this.
 *
 * @param {string} groupName - The name for the new Telegram group.
 * @returns {Promise<{chatId: string, inviteLink: string | null}>} - The ID of the created chat and its invite link.
 */
async function createTelegramGroup(groupName) {
  try {
    console.log(`[Telegram Service] Attempting to create Telegram group: "${groupName}"`);

    // Create the basic group (without initial members, as they will join via link)
    const createResponse = await airgram.api.createNewBasicGroupChat({
      title: groupName,
      user_ids: [], // No initial members added programmatically
    });

    if (createResponse._ !== 'updateChat' || !createResponse.chat) {
      console.error('[Telegram Service] Unexpected Airgram response for group creation:', createResponse);
      throw new Error('Failed to create Telegram group: Unexpected API response.');
    }

    const chatId = createResponse.chat.id;
    console.log(`[Telegram Service] Basic group created. Chat ID: ${chatId}`);

    // Now, get an invite link for the newly created chat
    // You might need to make the current bot an administrator of the group if it's not by default
    // and if you want to create permanent or revocable links.
    // For basic groups, createChatInviteLink creates a temporary (non-revocable) or permanent link.
    const inviteLinkResponse = await airgram.api.createChatInviteLink({
        chat_id: chatId,
        // Optional: expire_date, member_limit, creates_join_request, name
        // For simplicity, we'll create a basic permanent link.
        member_limit: 0, // No limit
        creates_join_request: false, // Users join directly
    });


    if (inviteLinkResponse._ === 'chatInviteLink') {
        console.log(`[Telegram Service] Invite link generated for chat ${chatId}: ${inviteLinkResponse.inviteLink}`);
        return {
            chatId: String(chatId), // Ensure it's a string
            inviteLink: inviteLinkResponse.inviteLink
        };
    } else if (inviteLinkResponse.error) {
        console.error('[Telegram Service] Error creating invite link:', inviteLinkResponse.error);
        throw new Error(`Telegram API Error creating invite link: ${inviteLinkResponse.error.message}`);
    } else {
        console.warn('[Telegram Service] Unexpected Airgram response for invite link creation:', inviteLinkResponse);
        // Fallback: If link creation failed, still return chat ID but with null link
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

// `addTelegramGroupMembers` function is REMOVED as users will join via link.
// If you need it for other purposes, keep it, but it's not used for this workflow.

// Ensure Airgram is ready and connected (run once on server startup)
async function startAirgram() {
  if (process.env.TELEGRAM_SESSION_STRING) {
    airgram.use(new Auth({ session: process.env.TELEGRAM_SESSION_STRING }));
    console.log('[Airgram Init] Using session string for login...');
  } else {
    console.log('[Airgram Init] No session string found. Initiating interactive login...');
    airgram.use(new Auth({
      code: async (e) => await ask(`(AIRGRAM INIT) Please enter the secret code for ${e.phoneNumber}: `),
      phoneNumber: async () => await ask('(AIRGRAM INIT) Please enter your phone number (e.g., +1234567890): ')
    }));
  }

  airgram.on('update', (update) => {
    if (update._ === 'updateAuthorizationState' && update.authorizationState._ === 'authorizationStateReady') {
      console.log('Airgram: Logged into Telegram successfully!');
    } else if (update._ === 'updateAuthorizationState') {
      console.log('Airgram Auth State:', update.authorizationState._);
    }
  });

  await airgram.init();
  console.log('Airgram initialized.');
}

export {
  createTelegramGroup,
  // addTelegramGroupMembers is no longer exported
  startAirgram
};