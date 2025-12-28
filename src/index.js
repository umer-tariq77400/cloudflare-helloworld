/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
  // This function runs on a schedule (Cron Trigger)
  async scheduled(event, env, ctx) {
    const urlToCheck = "https://www.google.com"; // Change to any site you want

    console.log(`Checking status for: ${urlToCheck} ...`);

    const response = await fetch(urlToCheck);

    if (response.status === 200) {
      console.log("✅ Website is UP! Updated 2");
    } else {
      console.log(`❌ Website is DOWN! Status: ${response.status} Updated 2`);
      // In a real job, you would send a Slack/Discord alert here
    }
  },

  // This function runs if you visit the worker URL in a browser
  async fetch(request, env, ctx) {
    return new Response("This worker runs on a schedule. Check the logs! Updated 2");
  },
};
