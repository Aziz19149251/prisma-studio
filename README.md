# 1. Initialize Git
git init

# 2. Add all your files
git add .

# 3. Commit them (Save them to history)
git commit -m "Initial commit - Premium Light Theme"

# 4. Connect to GitHub (Replace URL below with YOUR repo link)
# You will find this link on the page you just opened on GitHub.
# It looks like: https://github.com/your-username/prisma-studio.git
git remote add origin https://github.com/YOUR_USERNAME/prisma-studio.git

# 5. Push the code
git branch -M main
git push -u origin main

*(Note: If `git push` asks for a password, a popup window should appear to sign in to GitHub).*

### Step 3: Deploy to Vercel (The Magic Part)
Now that your code is on GitHub, deploying is instant.

1.  Go to **[Vercel.com](https://vercel.com)** and Sign Up (you can continue with GitHub).
2.  On your Dashboard, click **"Add New..."** -> **"Project"**.
3.  You will see "Import Git Repository". Find **`prisma-studio`** in the list and click **Import**.
4.  **Important:** If it asks for "Root Directory", leave it as `./` (default). If your code is inside a subfolder, click "Edit" and select the folder containing `package.json`.
5.  Click **Deploy**.

Wait about 30 seconds... and **BOOM!** 🎊
Vercel will give you a live URL (e.g., `prisma-studio-alpha.vercel.app`) that you can share with the world.

Let me know once you've pushed the code!
