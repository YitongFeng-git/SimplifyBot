// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Import required Bot Framework classes.
const { ActionTypes, ActivityHandler, CardFactory } = require("botbuilder");


class TeamsBot extends TeamsActivityHandler {
  /**
   *
   * @param {UserState} User state to persist boolean flag to indicate
   *                    if the bot had already welcomed the user
   */
  constructor() {
    super();


    this.onMessage(async (context, next) => {

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    // Sends welcome messages to conversation members when they join the conversation.
    this.onMembersAdded(async (context, next) => {
      await Promise.all((context.activity.membersAdded || []).map(async (member) => {
        // Since the bot is the recipient for events from the channel,
        // context.activity.membersAdded !== context.activity.recipient.Id indicates it is not a bot but a user.
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity(`Hello ${member.givenName} ${member.surname}, welcome to the Bot!`)
        }
      }));      
      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });
  }

  /**
   * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
   */
  async run(context) {
    await super.run(context);

    // Save state changes
    await this.userState.saveChanges(context);
  }
}

module.exports.TeamsBot = TeamsBot;
