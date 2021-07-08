// Require the Bolt package (github.com/slackapi/bolt)
const { App, ExpressReceiver } = require("@slack/bolt");
const ACData = require("adaptivecards-templating");
const issueBlockTempJobj = require("./github_issue_slack_block.json");

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

// All the room in the world for your code

app.event("team_join", async ({ event, client }) => {
  try {
    const result = await client.chat.postMessage({
      channel: "",
      text: `Welcome to the team, ${event.user.id}!`,
    });
  } catch (error) {
    console.error(error);
  }
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
    console.log(body);
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

async function  sendIssueUpdateCard(issueDto) {
  const issueACTemplate = new ACData.Template(issueBlockTempJobj);
  const evalContext = ACData.IEvaluationContext = issueDto;
  const slackBlock = issueACTemplate.expand(evalContext);
  await say(slackBlock);
}
