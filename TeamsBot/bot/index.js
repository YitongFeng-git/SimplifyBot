// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const restify = require("restify");

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter } = require("botbuilder");
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
  // application insights. See https://aka.ms/bottelemetry for telemetry configuration instructions.
  console.error(`\n [onTurnError] unhandled error: ${error}`);

  await context.sendActivity(
    `The bot encountered an error or bug: \n ${error.message} \n To continue to run this bot, please fix the bot source code.`
  );
};

// Create the main dialog.
const bot = new TeamsBot();

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
  req.on("readable", () => {
    let paragraph = req.read();
    if (paragraph) {
      body += paragraph;
    }
  });
  req.on("end", async () => {
    let issueDto = JSON.parse(body);
    issueDto = { $root: issueDto };
    try {
      bot.sendIssueUpdateCard(adapter, issueDto);
    } catch (err) {
      res.send(503, err.message);
    }
    res.send(200, "OK");
  });
});
