// ── Export utilities ───────────────────────────────────────────────────────
// No external libraries needed for CSV.
// For PDF, install jsPDF: npm install jspdf jspdf-autotable

// ════════════════════════════════════════
//  CSV EXPORT
// ════════════════════════════════════════

/**
 * Converts a transactions array to a CSV file and triggers a download.
 *
 * How it works:
 * 1. Build a header row string
 * 2. Map each transaction to a comma-separated row string
 * 3. Join all rows with newlines → one big string
 * 4. Create a Blob (binary large object) from the string
 * 5. Create a temporary <a> tag with an object URL → click it → download starts
 * 6. Clean up the object URL to free memory
 */
export function exportToCSV(transactions, filename = "transactions") {
  if (!transactions || transactions.length === 0) {
    alert("No transactions to export");
    return;
  }

  const headers = [
    "Date",
    "Description",
    "Type",
    "Category",
    "Division",
    "Amount",
  ];

  const rows = transactions.map((t) => [
    new Date(t.date).toLocaleDateString("en-IN"),
    // Wrap description in quotes — it may contain commas which would break CSV
    `"${(t.description || "").replace(/"/g, '""')}"`,
    t.type,
    t.category,
    t.division,
    t.amount,
  ]);

  // Join header + rows into one CSV string
  // \r\n is the standard CSV line ending (works on Windows and Mac)
  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\r\n",
  );

  // Blob: browser's way of holding raw binary data
  // "text/csv" MIME type tells the browser what kind of file this is
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a temporary URL that points to the blob in memory
  const url = URL.createObjectURL(blob);

  // Create a hidden <a> element, set download attribute, click it
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `${filename}-${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();

  // Clean up: remove the element and revoke the URL to free memory
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ════════════════════════════════════════
//  PDF EXPORT
// ════════════════════════════════════════

/**
 * Generates a styled PDF report and triggers a download.
 * Requires: npm install jspdf jspdf-autotable
 *
 * jsPDF coordinate system: top-left is (0,0), units are mm by default.
 * doc.text(string, x, y) — places text at (x, y) mm from top-left.
 * autoTable — plugin that renders a table from arrays automatically.
 */
export async function exportToPDF(transactions, filename = "transactions") {
  if (!transactions || transactions.length === 0) {
    alert("No transactions to export");
    return;
  }

  // Dynamic import — only loads jsPDF when this function is actually called.
  // This prevents the library from bloating the initial bundle.
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF();

  // ── Title ──
  doc.setFontSize(18);
  doc.setTextColor(30, 111, 217); // primary blue
  doc.text("Money Manager — Transactions", 14, 20);

  // ── Subtitle ──
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
    14,
    28,
  );
  doc.text(`Total records: ${transactions.length}`, 14, 34);

  // ── Summary line ──
  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);
  doc.text(
    `Total income: ₹${income.toFixed(2)}   Total expense: ₹${expense.toFixed(2)}   Balance: ₹${(income - expense).toFixed(2)}`,
    14,
    40,
  );

  // ── Table ──
  // autoTable is added to the jsPDF prototype by the import above
  doc.autoTable({
    startY: 48,
    head: [["Date", "Description", "Type", "Category", "Division", "Amount"]],
    body: transactions.map((t) => [
      new Date(t.date).toLocaleDateString("en-IN"),
      t.description,
      t.type,
      t.category,
      t.division,
      `${t.type === "INCOME" ? "+" : "-"}₹${t.amount.toFixed(2)}`,
    ]),
    headStyles: {
      fillColor: [30, 111, 217], // blue header
      fontSize: 9,
      fontStyle: "bold",
    },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    // Colour the amount column based on type
    didParseCell: (data) => {
      if (data.column.index === 5 && data.section === "body") {
        const isIncome = data.cell.raw.startsWith("+");
        data.cell.styles.textColor = isIncome ? [16, 185, 129] : [239, 68, 68];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  doc.save(`${filename}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
