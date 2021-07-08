// Require the Bolt package (github.com/slackapi/bolt)
const { App, ExpressReceiver } = require("@slack/bolt");
const ACData = require("adaptivecards-templating");
const issueBlockTempJobj = require("./github_issue_slack_block.json");

const channelName = "test-slack-apps";
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
});
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});


app.event("member_joined_channel", async ({ event, say }) => {
  console.log(JSON.stringify(event));
  await say(`Welcome to the team, ${event.user.id}!`);
});

// Other web requests are methods on receiver.router
receiver.router.post("/api/gitIssuesUpdated", (req, res) => {
  let body = "";
  let issueDto = {};
  req.on("readable", () => {
    let paragraph = req.read();
    if (paragraph) {
      body += paragraph;
    }
  });
  req.on("end", async () => {
    issueDto = JSON.parse(body);
    sendIssueUpdateCard(issueDto);

    res.write("OK");
    res.end();
  });
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();

// Find conversation ID using the conversations.list method
async function findConversation(name) {
  try {
    // Call the conversations.list method using the built-in WebClient
    const result = await app.client.conversations.list({
      // The token you used to initialize your app
      token: process.env.SLACK_BOT_TOKEN
    });

    for (const channel of result.channels) {
      if (channel.name === name) {
        // Print result
        console.log("Found conversation ID: " + channel.id);
        return channel.id;
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function sendIssueUpdateCard(issueDto) {
  try {
    issueDto = {
      $root: issueDto
    };
    const issueACTemplate = new ACData.Template(issueBlockTempJobj);
    const evalContext = (ACData.IEvaluationContext = issueDto);
    const slackBlock = issueACTemplate.expand(evalContext);
    console.log(JSON.stringify(slackBlock.blocks));
    const conversationId = await findConversation(channelName);
    const result = await app.client.chat.postMessage({
      // The token you used to initialize your app
      token: process.env.SLACK_BOT_TOKEN,
      channel: conversationId,
      blocks: slackBlock.blocks
    });
    // Print result, which includes information about the message (like TS)
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
