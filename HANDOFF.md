# Dad handoff — Inventory Clerk

You are taking over the **Inventory Clerk** Android app for Lake Cowal stock audits. Phase 1 is already on GitHub (`main`). From here you own builds, phone installs, and future changes.

---

## Paste this to yourself (email / SMS reminder)

```
Inventory Clerk handoff — Lake Cowal stock photo app

Repo: https://github.com/wade4p-a11y/Inventory-clerk
Phase 1 is already on main. You own builds and changes from here.

1) Free GitHub account + free Expo account (expo.dev).
2) Ask the current owner (wade4p-a11y) to invite you as a collaborator — accept the email.
3) Open HANDOFF.md in this repo and start at section 1.
4) Wireless phone install steps: README → “Install on Android (wireless)”.

No USB cable needed for the phone install.
```

---

## Checklist (do in order)

### 1. What you’re taking over

- **App:** Photograph stock, fill name / location / supplier / part number / asset / description, keep data on the phone, then **email an Excel file** (+ photos) for company Drive workflows.
- **Code:** Already on **`main`**.
- **You own:** Expo builds, installs on your phone, Settings (cache / export email), later changes.
- **You do not need:** USB for normal install, or Google Play for Phase 1.

### 2. Accounts you need (both free for this use)

| Account | Why | Sign up |
| --- | --- | --- |
| **GitHub** | Access this repo | https://github.com/signup |
| **Expo** | Cloud-build the Android APK | https://expo.dev → Sign up |

### 3. Get onto the repo

**Repo:** https://github.com/wade4p-a11y/Inventory-clerk

**Current owner (wade4p-a11y) — invite Dad:**

1. Repo → **Settings** → **Collaborators**.
2. **Add people** → Dad’s GitHub username/email.
3. Grant at least **Write** (or **Admin** if he’s taking full control).
4. Send invite.

**Dad — accept** the GitHub email/notification, then confirm you can open the repo link above.

### 4. Get the code on your computer

**Recommended: GitHub Desktop**

1. Install https://desktop.github.com/ and sign in.
2. **File → Clone repository** → **Inventory-clerk** → Clone.
3. Stay on branch **main**.

**Alternative:**

```bash
git clone https://github.com/wade4p-a11y/Inventory-clerk.git
cd Inventory-clerk
```

### 5. Install tools (once)

1. Install **Node.js LTS**: https://nodejs.org  
2. In the project folder:

```bash
npm install
```

3. Follow **README → [Install on Android (wireless)](./README.md#install-on-android-wireless)** for Expo login, `eas init`, and the first build. That section is the build source of truth inside this repo.

### 6. First wireless APK

```bash
eas build --platform android --profile preview
```

Wait for Expo → open the **install link / QR** on your Android phone → allow unknown apps if asked → Install **Inventory Clerk**. **No USB.**

### 7. Day-to-day control

**After code changes:** pull latest → run the same `eas build --platform android --profile preview` → install the **new** link on the phone.

**In the app**

| Place | Purpose |
| --- | --- |
| Capture | Photo of stock |
| Edit item | Six fields; barcode optional; Mark pending |
| Export pending | Excel + email/share |
| Locations | Named stores; optional GPS |
| Settings | Cache size, retention, default export email |

Still **no USB** for normal updates.

### 8. What was already done for you

- Phase 1 merged on `main` (capture, edit, queue, email Excel export, Settings, Locations, `eas.json`).
- Decisions locked: email + Excel, adjustable cache, EAS wireless install; label maker later only.
- You start at accounts → access → first build — not rewriting the app.

### 9. Optional: transfer repo ownership to Dad

**Owner:** Settings → General → Danger Zone → **Transfer ownership** → Dad’s GitHub user.  
**Dad:** Accept transfer; update GitHub Desktop / re-clone if the URL changes. Keep the same Expo login for builds.

### 10. Troubleshooting (short)

| Problem | Try |
| --- | --- |
| Can’t see the repo | Accept collaborator invite; correct GitHub user. |
| `eas whoami` not logged in | `eas login` |
| Project not linked | `eas init` in this folder; commit `app.json` if it changed. |
| Phone blocks install | Allow install from that browser/source; ask IT if work phone locks sideload. |
| Wrong app experience | Use the EAS **Inventory Clerk** APK, not only Expo Go. |
| Email export weak | Sign into a mail app; set default export email in Settings. |

---

## Links

- Repo: https://github.com/wade4p-a11y/Inventory-clerk  
- Build/install detail: [README — Install on Android (wireless)](./README.md#install-on-android-wireless)  
- EAS profiles: [`eas.json`](./eas.json)
