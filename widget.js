// ============================================
// פיננסייר Widget for iOS — Scriptable v1.0
// ============================================
// הגדרה:
// 1. פתח https://scriptable.app
// 2. New Script → שם: "finanseer"
// 3. הדבק קוד זה
// 4. שנה את DATA_URL לכתובת ה-Gist שלך (מהגדרות באפליקציה)
// 5. לחץ Run לבדיקה
// 6. Add Widget → Scriptable → Choose Script → finanseer
// ============================================

// 🔧 הגדר כאן — תקבל את ה-URL מתוך האפליקציה
const DATA_URL = "https://gist.githubusercontent.com/YOUR_USERNAME/YOUR_GIST_ID/raw/finanseer.json";

// ============================================

async function getData() {
  // Add cache-busting query param
  const req = new Request(DATA_URL + "?t=" + Date.now());
  req.timeoutInterval = 10;
  return await req.loadJSON();
}

// Widget sizes
const widgetFamily = config.widgetFamily || "small";

const widget = new ListWidget();
widget.backgroundColor = new Color("#0a0e27");
widget.url = "https://oranmikell-wq.github.io/finance/";

if (widgetFamily === "small") {
  widget.setPadding(14, 14, 10, 14);
} else {
  widget.setPadding(16, 16, 12, 16);
}

try {
  const d = await getData();

  // ── Header ──
  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();

  const logo = header.addText("💰");
  logo.font = Font.systemFont(widgetFamily === "small" ? 12 : 14);

  header.addSpacer();

  const title = header.addText("פיננסייר");
  title.font = Font.boldSystemFont(widgetFamily === "small" ? 12 : 14);
  title.textColor = new Color("#f4c430");

  widget.addSpacer(widgetFamily === "small" ? 6 : 10);

  // ── Total ──
  const totalSize = widgetFamily === "small" ? 22 : 28;
  const total = widget.addText(d.total);
  total.font = Font.boldSystemFont(totalSize);
  total.textColor = Color.white();
  total.minimumScaleFactor = 0.6;

  widget.addSpacer(3);

  // ── Change ──
  const change = widget.addText(d.change);
  change.font = Font.systemFont(widgetFamily === "small" ? 9 : 11);
  change.textColor = new Color(d.changePositive ? "#10b981" : "#ef4444");
  change.minimumScaleFactor = 0.7;

  // ── Breakdown (medium/large only) ──
  if (widgetFamily !== "small" && d.breakdown && d.breakdown.length > 0) {
    widget.addSpacer(10);

    // Divider
    const divider = widget.addStack();
    divider.size = new Size(0, 1);
    divider.backgroundColor = new Color("#ffffff", 0.08);

    widget.addSpacer(10);

    for (const item of d.breakdown) {
      const row = widget.addStack();
      row.layoutHorizontally();
      row.centerAlignContent();

      const lbl = row.addText(item.label);
      lbl.font = Font.systemFont(10);
      lbl.textColor = new Color("#94a3b8");

      row.addSpacer();

      const val = row.addText(item.value);
      val.font = Font.mediumSystemFont(10);
      val.textColor = Color.white();

      widget.addSpacer(4);
    }
  }

  widget.addSpacer();

  // ── Updated time ──
  const updText = widgetFamily === "small"
    ? "עודכן " + d.updatedAt
    : "עודכן " + d.updatedAt + " · " + d.updatedDate;
  const upd = widget.addText(updText);
  upd.font = Font.systemFont(7);
  upd.textColor = new Color("#475569");

} catch(e) {
  // Error state
  widget.setPadding(16, 16, 16, 16);

  const errTitle = widget.addText("⚠️ שגיאה");
  errTitle.font = Font.boldSystemFont(13);
  errTitle.textColor = new Color("#ef4444");

  widget.addSpacer(6);

  const errMsg = widget.addText(e.message || "בעיית חיבור");
  errMsg.font = Font.systemFont(10);
  errMsg.textColor = new Color("#94a3b8");
  errMsg.minimumScaleFactor = 0.7;

  widget.addSpacer(6);

  const hint = widget.addText("בדוק שה-DATA_URL נכון ושהאפליקציה פתוחה לפחות פעם אחת");
  hint.font = Font.systemFont(8);
  hint.textColor = new Color("#64748b");
}

Script.setWidget(widget);

// Preview in app
if (config.runsInApp) {
  widget.presentSmall();
}

Script.complete();
