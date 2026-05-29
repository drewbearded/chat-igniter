# Chat Igniter 🔥

Never stare at a quiet chat again. Instant engagement scripts for Twitch/YouTube streamers.

## Deploy to Vercel (5 minutes)

### Step 1 — Push to GitHub
1. Go to github.com and click **New repository**
2. Name it `chat-igniter`, keep it public, click **Create repository**
3. Upload all these files by clicking **uploading an existing file**
4. Drag the entire project folder in, click **Commit changes**

### Step 2 — Deploy on Vercel
1. Go to vercel.com and click **Add New Project**
2. Click **Import** next to your `chat-igniter` repo
3. Click **Deploy** (default settings are fine)

### Step 3 — Add your API Key
1. In Vercel, go to your project → **Settings** → **Environment Variables**
2. Add a new variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key (get one at console.anthropic.com)
3. Click **Save**, then go to **Deployments** and click **Redeploy**

Your app is live! Share the URL with anyone.

## Getting an Anthropic API Key
1. Go to console.anthropic.com
2. Sign up / log in
3. Go to **API Keys** → **Create Key**
4. Copy the key and paste it into Vercel as shown above
