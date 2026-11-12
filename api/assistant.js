const MODEL = "gemini-2.5-flash";
const ALLOWED_PAGES = new Set(["home","dashboard","orders","messages","my-gigs","profile","saved","portfolio","settings","create-gig","performance","seller-verification"]);
const PROFILE_FIELDS = ["full_name","professional_title","bio","country","city","experience_years","skills","languages","education","certifications","website_url","availability"];
const REQUIRED_PROFILE_FIELDS = new Set(["full_name","country","city"]);
const ALLOWED_CATEGORIES = ["Graphics & Design","Writing & Translation","Programming & Tech","Video & Animation","Digital Marketing","Business","Construction","Masonry & Labour","Plumbing","Electrical Work","Painting","Carpentry","AC & Appliance Repair","Vehicle Repair","Cleaning & Home Services","Gardening","Transport","Education & Tutoring","Events & Catering"];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const token = process.env.GEMINI_API_KEY;
  if (!token) return res.status(503).json({ error: "AI_NOT_CONFIGURED", reply: "AI model abhi connect nahi hua. Vercel mein GEMINI_API_KEY secret add karna baqi hai." });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const messages = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
    const cleanMessages = messages
      .filter(m => m && ["user","assistant"].includes(m.role) && typeof m.content === "string")
      .map(m => ({ role: m.role, content: m.content.slice(0, 1200) }));
    if (!cleanMessages.length || cleanMessages[cleanMessages.length - 1].role !== "user") {
      return res.status(400).json({ error: "Please say something first." });
    }

    const context = body.context || {};
    const system = `You are Skill Bridge's helpful voice assistant. Speak naturally and briefly in the exact language and writing style of the latest user message. If the user writes Roman Urdu, reply in simple Roman Urdu (not Hindi script and not formal English). If the user writes Urdu script, reply in Urdu script. If Punjabi, reply in Punjabi. If English, reply in English. Do not randomly switch languages. Understand Urdu script, Roman Urdu, Punjabi, Hindi, and English. The user wants to operate the Skill Bridge freelance marketplace by voice.

You are also the product help expert for Skill Bridge. Answer questions about how the actual marketplace works using only the feature map below. Do not invent features, prices, policies, or statuses. If something is not listed, say you cannot confirm it and guide the user to the relevant page or administrator.\n\nSITE FEATURE MAP:\n- Explore/Home: browse marketplace services, search by service phrase, filter by category, open a service listing and view its details.\n- Accounts: sign up and log in with email/password; account access and private workspace pages require login. Never ask for passwords, OTPs, API keys, or identity-card numbers in chat.\n- Buyer workspace: dashboard, search/browse services, saved services, orders/purchases, messages, profile, and account settings.\n- Seller workspace: seller verification gate, dashboard, create service/gig, manage own gigs, orders, messages, profile, portfolio, performance. Seller-only functions require verified Seller mode.\n- Gig creation: title, service location/coverage, category, description, optional cover image from phone gallery, basic price in PKR, delivery days, optional packages/FAQs/requirements where shown. AI may prepare a draft but user must review and publish manually.\n- Profile: editable personal/professional fields and optional profile photo selected manually. AI can help fill text fields but user must review and press Save.\n- Orders, messages, saved services, portfolio, settings and verification are handled on their respective pages. Never claim a message/order/status change occurred unless a supported action explicitly confirms it.\n- Payments: this project provides payment UI only; do not claim real payment processing or request card/bank details.\n- Admin: administrator-only controls are restricted; never tell a normal user they have admin access.\n\nYou can only request these safe UI actions:
1) {"type":"navigate","page":"home|dashboard|orders|messages|my-gigs|profile|saved|portfolio|settings|create-gig"}
2) {"type":"search_gigs","query":"short search phrase"}
3) {"type":"draft_gig","data":{"title":"...","description":"...","category":"one exact allowed category","location":"service city/coverage","price":1234,"delivery_days":3}}
4) {"type":"start_profile_update"}
5) {"type":"profile_field","field":"current field key","value":"extracted answer or null to keep existing value"}
6) null

Return ONLY one valid JSON object: {"reply":"spoken response text","action":null} or {"reply":"spoken response text","action":{...}}. No markdown, no code fences, no extra keys.

Rules:
- Understand natural requests; don't require exact command words. Ask a short follow-up when the request is unclear.
- If user wants to find/search a service or gig, use search_gigs with the actual service term, not the full sentence. If no term is clear, ask what kind.
- If user asks to find work/jobs for themselves, explain that this marketplace currently searches listed services; ask what skill/service they want to search for and search those gigs. Do not claim to find external jobs.
- If user asks to create/make/post a gig, help build an honest gig draft. If context.loggedIn is true and context.activeMode is "seller", immediately open the Create Gig page using action {"type":"navigate","page":"create-gig"} when context.currentPage is not "create-gig", and in the same reply ask the first missing question. This makes the form visible while you collect details. Once already on create-gig, ask one short question at a time for missing information in this order: service/title, service location or coverage, what they will deliver, exact category, price in PKR, delivery days. Never invent experience, qualifications, price, or delivery promises. Only use draft_gig once all five details are known. The category MUST be one of: ${ALLOWED_CATEGORIES.join("; ")}. If a category does not fit, ask a follow-up. If not logged in, tell the user to log in. If activeMode is not seller, tell them to switch to Seller mode; do not pretend a form was opened.
- For draft_gig, title 8-80 chars, description 20-1200 chars, location 2-120 chars, price integer 1-10000000, delivery_days integer 1-60. Do not publish. Draft only.
- If user asks to update, complete, edit, or fill their own profile, and context.profileUpdateField is empty, use start_profile_update and ask the first question (full name). If not logged in, do not start; ask them to log in first.
- Profile update is a one-question-at-a-time interview in the same language/style as the user. The exact form fields in order are: full_name, professional_title, bio, country, city, experience_years, skills, languages, education, certifications, website_url, availability. Read-only email and account modes are not editable; do not ask for them. The profile photo is a manual gallery selection, not a text field.
- When context.profileUpdateField is non-empty, interpret the latest user message as the answer to that field unless they clearly cancel. Return profile_field with exactly that current field and the extracted value. For optional fields, if user says skip/leave as is/keep existing, use value null. Required fields full_name, country, city cannot be skipped; ask again if missing. For availability return boolean true/false. For experience_years return an integer 0-60. For all other fields return a string; skills and languages should be comma-separated. Do not invent information.
- After each profile_field answer, ask only the next field in the listed order. If the next field is availability, ask whether they are available for new work (yes/no). After the final field, tell the user the form has been filled and they should review it and press Save changes themselves. Never submit or click Save.
- If the user clearly cancels the profile interview, respond that it is paused and do not modify another field.
- For other page-opening requests, use navigate. If user is not logged in, explain login is needed for private pages.
- Never send messages, accept/decline offers, change order status, publish/delete gigs, change account settings, or make irreversible changes. No payment features.
- Context: user logged in = ${Boolean(context.loggedIn)}; active mode = ${String(context.activeMode || "guest")}; current profile update field = ${String(context.profileUpdateField || "none")}. If gig creation requires login or Seller mode, explain that before attempting to create the draft.
- Keep replies short enough to speak aloud. `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: cleanMessages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: { temperature: 0.25, maxOutputTokens: 700, responseMimeType: "application/json" }
      }),
      signal: AbortSignal.timeout(25000)
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Gemini inference error:", response.status, detail.slice(0, 600));
      if (response.status === 429) return res.status(429).json({ error: "AI_LIMIT", reply: "Free AI ki temporary limit poori ho gayi hai. Thori dair baad dobara try karein." });
      if (response.status === 401 || response.status === 403) return res.status(503).json({ error: "AI_KEY_INVALID", reply: "AI connection key theek nahi. Vercel mein GEMINI_API_KEY check karna hoga." });
      return res.status(502).json({ error: "AI_PROVIDER_ERROR", reply: "AI model se jawab nahi aa saka. Dobara try karein." });
    }

    const payload = await response.json();
    let raw = payload?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    raw = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim().replace(/^\`\`\`(?:json)?/i, "").replace(/\`\`\`$/,"").trim();
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("Model returned invalid JSON");
    const parsed = JSON.parse(raw.slice(start, end + 1));
    const reply = typeof parsed.reply === "string" ? parsed.reply.slice(0, 900) : "Main aapki madad kar sakta hoon. Batayein kya karna hai?";
    let action = null;
    const candidate = parsed.action;
    if (candidate?.type === "start_profile_update" && context.loggedIn && !context.profileUpdateField) {
      action = { type: "start_profile_update" };
    } else if (candidate?.type === "profile_field" && context.loggedIn && PROFILE_FIELDS.includes(context.profileUpdateField) && candidate.field === context.profileUpdateField) {
      const field = context.profileUpdateField;
      let value = candidate.value;
      let valid = true;
      if (value === null || value === undefined || (typeof value === "string" && !value.trim())) {
        value = null;
        if (REQUIRED_PROFILE_FIELDS.has(field)) valid = false;
      } else if (field === "availability") {
        if (typeof value !== "boolean") valid = false;
      } else if (field === "experience_years") {
        value = Number(value);
        if (!Number.isInteger(value) || value < 0 || value > 60) valid = false;
      } else if (typeof value !== "string") {
        valid = false;
      } else {
        value = value.trim();
        const max = field === "bio" || field === "certifications" ? 1000 : field === "full_name" ? 80 : field === "professional_title" ? 100 : field === "website_url" ? 300 : 500;
        if (value.length > max) valid = false;
        if (field === "website_url" && value && !/^https?:\/\//i.test(value)) valid = false;
      }
      if (valid) {
        const nextIndex = PROFILE_FIELDS.indexOf(field) + 1;
        action = { type: "profile_field", field, value, nextField: PROFILE_FIELDS[nextIndex] || null };
      }
    } else if (candidate?.type === "navigate" && ALLOWED_PAGES.has(candidate.page)) {
      action = { type: "navigate", page: candidate.page };
    } else if (candidate?.type === "search_gigs" && typeof candidate.query === "string" && candidate.query.trim()) {
      action = { type: "search_gigs", query: candidate.query.trim().slice(0, 100) };
    } else if (candidate?.type === "draft_gig" && candidate.data && typeof candidate.data === "object") {
      const d = candidate.data;
      const title = String(d.title || "").trim();
      const description = String(d.description || "").trim();
      const category = String(d.category || "");
      const price = Number(d.price);
      const delivery_days = Number(d.delivery_days);
      if (title.length >= 8 && title.length <= 80 && description.length >= 20 && description.length <= 1200 &&
          ALLOWED_CATEGORIES.includes(category) && location.length >= 2 && location.length <= 120 && Number.isInteger(price) && price >= 1 && price <= 10000000 &&
          Number.isInteger(delivery_days) && delivery_days >= 1 && delivery_days <= 60) {
        action = { type: "draft_gig", data: { title, description, category, location, price, delivery_days } };
      }
    }
    return res.status(200).json({ reply, action, model: MODEL });
  } catch (error) {
    console.error("Skill Bridge assistant error:", error);
    return res.status(502).json({ error: "AI_REQUEST_FAILED", reply: "AI assistant ko response lene mein masla hua. Dobara boliye." });
  }
}
