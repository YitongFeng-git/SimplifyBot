// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Import required Bot Framework classes.
const {
  TeamsActivityHandler,
  CardFactory,
} = require("botbuilder");
const ACData = require("adaptivecards-templating");
const issueACTempJobj = require("./github_issue_adaptive_card.json");
class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();

    // record team channel id
    this.teamsChannelId = "19:120548056a05417bb46f567fec78cf14@thread.tacv2";
    this.serviceUrl = "https://smba.trafficmanager.net/apac/";

    this.onMessage(async (context, next) => {
      this.serviceUrl = context.activity.serviceUrl;
      await context.sendActivity(`You sent "${context.activity.text}"`);
      await next();
    });

    //Sends welcome messages to conversation members when they join the conversation.
    this.onMembersAdded(async (context, next) => {
      this.teamsChannelId = "19%3a120548056a05417bb46f567fec78cf14%40thread.tacv2";
      this.serviceUrl = context.activity.serviceUrl;

      await Promise.all(
        (context.activity.membersAdded || []).map(async (member) => {
          // Since the bot is the recipient for events from the channel,
          // context.activity.membersAdded !== context.activity.recipient.Id indicates it is not a bot but a user.
          if (member.id !== context.activity.recipient.id) {
            await context.sendActivity(`welcome to the Bot!`);
          }
        })
      );
      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

  }

  /**
   * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
   */
  async run(context) {
    await super.run(context);
  }

  async teamsCreateConversation(activityToSend, teamsChannelId, adapter) {
    if (!teamsChannelId) {
      throw new Error("Error! No teams channel id!");
    }
    if (!this.serviceUrl) {
      throw new Error("Error! No service url!");
    }
    const conversationParameters = {
      isGroup: true,
      channelData: {
        channel: {
          id: teamsChannelId,
        },
      },

      activity: activityToSend,
    };
    const connectorClient = adapter.createConnectorClient(this.serviceUrl);
    const conversationResourceResponse =
      await connectorClient.conversations.createConversation(
        conversationParameters
      );
  }

  async sendIssueUpdateCard(adapter, issueDto) {
    const issueACTemplate = new ACData.Template(issueACTempJobj);
    const adaptiveCard = issueACTemplate.expand(issueDto);
    const adaptiveCardAttach = CardFactory.adaptiveCard(adaptiveCard);
    console.log(JSON.stringify(adaptiveCard));
    await this.teamsCreateConversation({attachments: [adaptiveCardAttach], type: "message"}, this.teamsChannelId, adapter)
  }

}

module.exports.TeamsBot = TeamsBot;
