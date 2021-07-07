// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Import required packages
const restify = require("restify");

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter, UserState, MemoryStorage } = require("botbuilder");

const { TeamsBot } = require("./teamsBot.js");

// Create bot adapter.
// See https://aka.ms/about-bot-adapter to learn more about bot adapter.
const adapter = new BotFrameworkAdapter({
  appId: process.env.BOT_ID,
  appPassword: process.env.BOT_PASSWORD,
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
  // This check writes out errors to console log .vs. app insights.
  // NOTE: In production environment, you should consider logging this to Azure
  //       application insights. See https://aka.ms/bottelemetry for telemetry
  //       configuration instructions.
  console.error(`\n [onTurnError] unhandled error: ${error}`);

  // Send a trace activity, which will be displayed in Bot Framework Emulator
  await context.sendTraceActivity(
    "OnTurnError Trace",
    `${error}`,
    "https://www.botframework.com/schemas/error",
    "TurnError"
  );

  // Send a message to the user
  await context.sendActivity(
    `The bot encountered an error or bug: \n ${error.message}`
  );
  await context.sendActivity(
    "To continue to run this bot, please fix the bot source code."
  );
};

// Define a state store for your bot. See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state store to persist the dialog and user state between messages.

// For local development, in-memory storage is used.
// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone.
const memoryStorage = new MemoryStorage();
const userState = new UserState(memoryStorage);

// Create the main dialog.
const conversationReferences = {};
const bot = new TeamsBot(conversationReferences);

// Create HTTP server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log(`\nBot started, ${server.name} listening to ${server.url}`);
});

// Listen for incoming activities and route them to your bot main dialog.
server.post("/api/messages", (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    // route to main dialog.
    await bot.run(context);
  });
});

server.post("/api/gitIssuesUpdated", async (req, res) => {  
  let body = "";
  let issueDto = {};
  req.on("readable", () => {
    let paragraph = req.read();
    if (paragraph) {
      body += paragraph;
    }
  });
  req.on("end", async () => {
    console.log(body);
    issueDto = JSON.parse(body);

    for (const conversationReference of Object.values(conversationReferences)) {
      await adapter.continueConversation(
        conversationReference,
        async (turnContext) => {
          issueDto = {
            $root: issueDto
          }
          await bot.sendIssueUpdateCard(turnContext, issueDto);
        }
      );
    }

    res.write("OK");
    res.end();
  });
  
});
