// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Import required Bot Framework classes.
const {
  ActionTypes,
  TeamsActivityHandler,
  CardFactory,
  TurnContext,
  ActivityFactory,
} = require("botbuilder");
const ACData = require("adaptivecards-templating");
const issueACTempJobj = require("./github_issue_adaptive_card.json");
class TeamsBot extends TeamsActivityHandler {
  constructor(conversationReferences) {
    super();

    // Dependency injected dictionary for storing ConversationReference objects used in NotifyController to proactively message users
    this.conversationReferences = conversationReferences;

    this.onMessage(async (context, next) => {
      this.addConversationReference(context.activity);
      await context.sendActivity(`You sent "${context.activity.text}"`);
      await next();
    });

    //Sends welcome messages to conversation members when they join the conversation.
    this.onMembersAdded(async (context, next) => {
      this.addConversationReference(context.activity);
      await Promise.all((context.activity.membersAdded || []).map(async (member) => {
        // Since the bot is the recipient for events from the channel,
        // context.activity.membersAdded !== context.activity.recipient.Id indicates it is not a bot but a user.
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity(`welcome to the Bot!`)
        }
      }));
      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    this.onConversationUpdate(async (context, next) => {
      this.addConversationReference(context.activity);

      await next();
    });
  }

  /**
   * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
   */
  async run(context) {
    await super.run(context);
  }

  addConversationReference(activity) {
    const conversationReference =
      TurnContext.getConversationReference(activity);
    this.conversationReferences[conversationReference.conversation.id] =
      conversationReference;
  }

  async sendIssueUpdateCard(context, issueDto) {
    const issueACTemplate = new ACData.Template(issueACTempJobj);
    const evalContext = ACData.IEvaluationContext = issueDto;
    const adaptiveCard = issueACTemplate.expand(evalContext);
    const adaptiveCardAttach = CardFactory.adaptiveCard(adaptiveCard);
    console.log(JSON.stringify(adaptiveCard));
    await context.sendActivity({ attachments: [adaptiveCardAttach] });
  }
}

module.exports.TeamsBot = TeamsBot;
