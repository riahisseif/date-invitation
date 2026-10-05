# 💌 A little note for you

A small, mobile-first romantic date invitation: an envelope she opens, a question with a "No" button that runs away, a calendar and time picker, and a celebration when she confirms. Pure HTML, CSS and JavaScript, ready for GitHub Pages.

The site is intentionally generic: no names appear anywhere.

When she confirms, two things happen:

1. **Automatically:** her answer is sent to your email through Formspree (once you paste your endpoint, see below).
2. **Optionally:** she can tap **Send me a message 💬**, which opens WhatsApp to your number with the date and time already written. She only presses Send.

## What's in the project

```
(repository root)
├── index.html          ← required
├── style.css           ← required
├── script.js           ← required (CONFIG at the top)
├── assets/             ← required (icons + link preview image)
│   ├── favicon.svg
│   ├── favicon-32.png
│   ├── apple-touch-icon.png
│   └── og-image.png
├── .nojekyll           ← optional (hidden file, fine to skip)
├── README.md           ← optional (just documentation)
└── backend-examples/   ← optional, NOT used by the Formspree version
```

`index.html` must be at the **root** of the repository, not inside a subfolder.

## 1. Set up Formspree (free, about 5 minutes)

1. Go to **formspree.io** and sign up with the email address where you want to receive her answer.
2. Open the verification email from Formspree and click the link. Submissions only arrive once your email is verified.
3. In the Formspree dashboard, click **+ Add New → New Form**. Give it a name like "Date invitation".
   - The form sends to your account email by default. To use a different address, add and verify it under your Formspree account settings first, then pick it for this form.
4. Click **Create Form**.
5. On the form's page (Integration tab), copy the endpoint. It looks like: `https://formspree.io/f/abcdwxyz`

The free plan includes 50 submissions per month, which is plenty.

## 2. Paste your endpoint into the project

Open `script.js` and find this line in the `CONFIG` block near the top:

```js
formspreeEndpoint: "PASTE_YOUR_FORMSPREE_ENDPOINT_HERE",
```

Replace the placeholder with your endpoint, keeping the quotes:

```js
formspreeEndpoint: "https://formspree.io/f/abcdwxyz",
```

Save the file. That's the only change needed. The endpoint is public by design. It isn't a password or API key, so it's safe in a public website. Never put real secrets (API keys, bot tokens, passwords) in `script.js`.

Until you paste an endpoint, the site still works: it just skips the automatic email, and she can use the WhatsApp button.

### What you receive

Each confirmation emails you these fields:

| Field | Example |
|---|---|
| Accepted | Yes ❤️ |
| Selected date | Saturday, October 10, 2026 |
| Selected time | 5:00 PM |
| Date (YYYY-MM-DD) | 2026-10-10 |
| Time (24h) | 17:00 |
| No-button attempts | 7 |
| Submitted at | Saturday, October 3, 2026 at 9:41:12 PM GMT+2 |
| Submitted at (UTC) | 2026-10-03T19:41:12.000Z |

The email subject is set by `formspreeSubject` in `CONFIG`. Every answer is also listed in the Formspree dashboard under the form's **Submissions** tab.

## 3. Upload to GitHub

1. Create a GitHub account at github.com if you don't have one.
2. Click **+ → New repository**, give it a name (e.g. `date`), set it to **Public**, and click **Create repository**.
3. On the empty repository page, click **uploading an existing file**.
4. Unzip the ZIP. Select **the files inside it** (`index.html`, `style.css`, `script.js`, the `assets` folder, and optionally `README.md`) and drag them into the upload area.
   Do **not** drag a folder that contains them, or `index.html` ends up inside a subfolder and the site shows a 404.
5. Click **Commit changes**.
6. Check: the repository's main page should list `index.html` directly, next to `script.js`, `style.css` and `assets`.

## 4. Turn on GitHub Pages

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Pick branch **main** and folder **/(root)**, then click **Save**.

## 5. Get your website URL

Wait 1–2 minutes and refresh **Settings → Pages**. Your link appears at the top:

```
https://YOUR-USERNAME.github.io/REPOSITORY-NAME/
```

Optional: so the envelope preview image shows when you send the link, edit `index.html` on GitHub (pencil icon) and replace `YOUR-USERNAME` and `YOUR-REPO` in the Open Graph tags with your real address. Commit.

## 6. Test that Confirm sends you the date and time

1. Open your website URL (ideally on your phone).
2. Open the envelope, tap Yes, pick a day, pick a time, and tap **Confirm our date ❤️**.
3. The success screen should say **"Your answer was sent ❤️"**.
4. Within a minute you should get an email from Formspree with the selected date and time. Check your spam folder the first time and mark it "not spam".
5. You can also see the entry in the Formspree dashboard → your form → **Submissions**.
6. Tap **Send me a message 💬** to check that WhatsApp opens to your number with the message filled in.

If the success screen says "Your answer didn't send automatically":
- Check that `formspreeEndpoint` is your exact endpoint, starts with `https://formspree.io/f/`, and is inside quotes.
- Make sure your Formspree email is verified.
- Make sure you uploaded the updated `script.js` and refreshed the page (a hard refresh, or a private tab, avoids an old cached copy).

Test submissions count toward the 50 per month. You can delete them in the dashboard.

## Testing locally (optional)

Double-click `index.html`, or serve the folder so you can open it on your phone over Wi-Fi:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`, or `http://YOUR-COMPUTER-IP:8000` on your phone.

## Customize

Everything is in the `CONFIG` block at the top of `script.js`:

| Setting | What it does |
|---|---|
| `kicker`, `question`, `lede` | Text on the question card |
| `yesText`, `noText`, `noTexts` | Button labels; `noTexts` cycle as she chases No |
| `yesGrowPerAttempt`, `yesMaxScale` | How much the Yes button grows |
| `dates.minDate` / `maxDate` / `daysAhead` | Which days she can pick (`"YYYY-MM-DD"`) |
| `dates.disabledWeekdays`, `blockedDates` | Days you're busy |
| `dates.weekStartsOn` | 0 = Sunday, 1 = Monday |
| `times` | Time slots, 24-hour `"HH:MM"` |
| `minHoursNotice` | Hides today's slots that are too soon |
| `locale` | Date/time format: `"en-US"`, `"en-GB"`, `"de-DE"`… |
| `successTitle`, `successText` | The final screen |
| `contact.whatsappNumber` | Your WhatsApp number, digits only (currently `49155510349968`) |
| `whatsappButtonText` | Label of the WhatsApp button |
| `shareMessage` | The prepared message; `{date}`, `{day}`, `{time}` are filled in |
| `contact.email` | Optional extra "Send by email" button |
| `calendarEvent` | Title, details, location, duration for Google Calendar |
| `formspreeEndpoint`, `formspreeSubject` | Automatic email via Formspree |

The envelope title ("A little note for you 💕") is in `index.html`, along with the page title and social preview text.

**Colors:** the palette is at the top of `style.css` (`--blush`, `--petal`, `--rose`, `--rose-deep`, `--lilac`, `--cream`, `--ink`). Fonts are Fraunces and Nunito from Google Fonts.

## Other ways to receive answers (optional)

The `backend-examples/` folder has alternatives to Formspree. You don't need it for the Formspree setup, and you don't need to upload it.

- **Google Sheets** (`google-apps-script.gs`): each answer becomes a row in your own sheet. Set `backend: { method: "googleSheets", endpoint: "…/exec" }`.
- **Telegram** (`telegram-cloudflare-worker.js`): instant Telegram message. The bot token stays in Cloudflare as a secret. Set `backend: { method: "custom", endpoint: "https://…workers.dev" }`.
