let database;
let currentChallenge = 0;
let timer;
let totalSeconds = 90 * 60;
let challengePassed = false;
let gameStarted = false;
let studentDetails;

const setupSql = `
  PRAGMA foreign_keys = ON;
  CREATE TABLE staff (
    staff_id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL,
    department TEXT NOT NULL,
    job_title TEXT NOT NULL,
    clearance_level INTEGER NOT NULL CHECK (clearance_level BETWEEN 1 AND 5)
  );
  CREATE TABLE galleries (
    gallery_id INTEGER PRIMARY KEY,
    gallery_name TEXT NOT NULL UNIQUE,
    security_zone TEXT NOT NULL CHECK (security_zone IN ('PUBLIC', 'RESTRICTED'))
  );
  CREATE TABLE artifacts (
    artifact_id TEXT PRIMARY KEY,
    artifact_name TEXT NOT NULL UNIQUE,
    home_gallery_id INTEGER NOT NULL REFERENCES galleries(gallery_id),
    estimated_value INTEGER NOT NULL CHECK (estimated_value > 0)
  );
  CREATE TABLE museum_events (
    event_id INTEGER PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(staff_id),
    gallery_id INTEGER NOT NULL REFERENCES galleries(gallery_id),
    event_time TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('ENTRY', 'EXIT', 'ROUTINE_SCAN', 'ALERT_SCAN')),
    artifact_id TEXT REFERENCES artifacts(artifact_id)
  );

  INSERT INTO staff VALUES
    (1, 'Ava Stone', 'Security', 'Security Officer', 4),
    (2, 'Ben Cole', 'Collections', 'Senior Curator', 4),
    (3, 'Cora Lin', 'Conservation', 'Conservator', 3),
    (4, 'Dev Malik', 'Museum Technology', 'Systems Technician', 5),
    (5, 'Eli Ward', 'Registration', 'Registrar', 3),
    (6, 'Finn Gray', 'Security', 'Night Guard', 2);

  INSERT INTO galleries VALUES
    (1, 'Celestial Gallery', 'RESTRICTED'),
    (2, 'East Wing', 'RESTRICTED'),
    (3, 'Archive', 'RESTRICTED'),
    (4, 'Restoration Lab', 'RESTRICTED'),
    (5, 'Main Lobby', 'PUBLIC');

  INSERT INTO artifacts VALUES
    ('ART-01', 'Star of Asterion', 1, 9500000),
    ('ART-02', 'Sun Mask', 2, 1800000),
    ('ART-03', 'Lunar Astrolabe', 3, 2400000),
    ('ART-04', 'Ivory Atlas', 4, 1200000);

  INSERT INTO museum_events (event_id, staff_id, gallery_id, event_time, event_type) VALUES
    (1, 1, 1, '2025-11-18 20:00:00', 'ENTRY'),
    (2, 1, 1, '2025-11-18 20:20:00', 'EXIT'),
    (3, 2, 2, '2025-11-18 20:10:00', 'ENTRY'),
    (4, 2, 2, '2025-11-18 20:30:00', 'EXIT'),
    (5, 3, 4, '2025-11-18 20:15:00', 'ENTRY'),
    (6, 3, 4, '2025-11-18 20:35:00', 'EXIT'),
    (7, 4, 3, '2025-11-18 20:30:00', 'ENTRY'),
    (8, 4, 3, '2025-11-18 20:40:00', 'EXIT'),
    (9, 5, 1, '2025-11-18 20:45:00', 'ENTRY'),
    (10, 5, 1, '2025-11-18 21:00:00', 'EXIT'),
    (11, 6, 3, '2025-11-18 21:10:00', 'ENTRY'),
    (12, 6, 3, '2025-11-18 21:20:00', 'EXIT'),
    (13, 4, 1, '2025-11-18 21:12:00', 'ENTRY'),
    (14, 4, 1, '2025-11-18 21:25:00', 'EXIT'),
    (15, 4, 1, '2025-11-18 21:42:00', 'ENTRY'),
    (16, 4, 2, '2025-11-18 21:48:00', 'ENTRY'),
    (17, 4, 1, '2025-11-18 21:50:00', 'EXIT'),
    (18, 4, 2, '2025-11-18 22:00:00', 'EXIT'),
    (19, 4, 3, '2025-11-18 22:30:00', 'ENTRY'),
    (20, 4, 3, '2025-11-18 22:40:00', 'EXIT'),
    (21, 4, 5, '2025-11-18 23:05:00', 'ENTRY'),
    (22, 4, 5, '2025-11-18 23:10:00', 'EXIT');

  INSERT INTO museum_events (event_id, staff_id, gallery_id, event_time, event_type, artifact_id) VALUES
    (23, 1, 1, '2025-11-18 18:00:00', 'ROUTINE_SCAN', 'ART-01'),
    (24, 2, 2, '2025-11-18 18:05:00', 'ROUTINE_SCAN', 'ART-02'),
    (25, 6, 3, '2025-11-18 18:10:00', 'ROUTINE_SCAN', 'ART-03'),
    (26, 3, 4, '2025-11-18 18:15:00', 'ROUTINE_SCAN', 'ART-04'),
    (27, 4, 2, '2025-11-18 21:49:00', 'ALERT_SCAN', 'ART-01'),
    (28, 2, 2, '2025-11-18 21:55:00', 'ALERT_SCAN', 'ART-02');
`;

const challenges = [
  {
    title: "Challenge 1: Meet the artifacts",
    difficulty: "Getting started",
    prompt: "Show the name of every artifact. Return artifact_name and sort the names alphabetically.",
    expected: [["Ivory Atlas"], ["Lunar Astrolabe"], ["Star of Asterion"], ["Sun Mask"]]
  },
  {
    title: "Challenge 2: Meet the security team",
    difficulty: "Getting started",
    prompt: "Find staff in the Security department. Return full_name.",
    expected: [["Ava Stone"], ["Finn Gray"]]
  },
  {
    title: "Challenge 3: Find restricted galleries",
    difficulty: "Getting started",
    prompt: "Find the galleries marked RESTRICTED. Return gallery_name, sorted alphabetically.",
    expected: [["Archive"], ["Celestial Gallery"], ["East Wing"], ["Restoration Lab"]]
  },
  {
    title: "Challenge 4: Staff with clearance",
    difficulty: "Getting started",
    prompt: "Find staff with a clearance level of 3 or higher. Return full_name and clearance_level, sorted from highest clearance to lowest.",
    expected: [
      ["Dev Malik", "5"],
      ["Ava Stone", "4"],
      ["Ben Cole", "4"],
      ["Cora Lin", "3"],
      ["Eli Ward", "3"]
    ]
  },
  {
    title: "Challenge 5: Top three artifacts by value",
    difficulty: "Practice",
    prompt: "Find the three most valuable artifacts. Return artifact_name and estimated_value, ordered from highest value to lowest. Use LIMIT to return only three rows.",
    expected: [
      ["Star of Asterion", "9500000"],
      ["Lunar Astrolabe", "2400000"],
      ["Sun Mask", "1800000"]
    ]
  },
  {
    title: "Challenge 6: Count event types",
    difficulty: "Practice",
    prompt: "Use GROUP BY to count how many times each event_type appears in museum_events. Return event_type and event_count, sorted by event_type.",
    expected: [["ALERT_SCAN", "2"], ["ENTRY", "11"], ["EXIT", "11"], ["ROUTINE_SCAN", "4"]]
  },
  {
    title: "Challenge 7: Count staff by department",
    difficulty: "Practice",
    prompt: "Use GROUP BY to count staff members in each department. Return department and staff_count, sorted by department.",
    expected: [
      ["Collections", "1"],
      ["Conservation", "1"],
      ["Museum Technology", "1"],
      ["Registration", "1"],
      ["Security", "2"]
    ]
  },
  {
    title: "Challenge 8: Find each artifact's home",
    difficulty: "Practice",
    prompt: "Join artifacts to galleries to find where each artifact belongs. Return artifact_name and gallery_name, sorted by artifact name.",
    expected: [
      ["Ivory Atlas", "Restoration Lab"],
      ["Lunar Astrolabe", "Archive"],
      ["Star of Asterion", "Celestial Gallery"],
      ["Sun Mask", "East Wing"]
    ]
  },
  {
    title: "Challenge 9: Evening arrivals",
    difficulty: "Practice",
    prompt: "Use museum_events to find staff ENTRY events between 8:00 PM and 8:15 PM on November 18, 2025. Join staff and galleries. Return full_name, gallery_name, and event_time in time order.",
    expected: [
      ["Ava Stone", "Celestial Gallery", "2025-11-18 20:00:00"],
      ["Ben Cole", "East Wing", "2025-11-18 20:10:00"],
      ["Cora Lin", "Restoration Lab", "2025-11-18 20:15:00"]
    ]
  },
  {
    title: "Challenge 10: Restricted-gallery visits",
    difficulty: "Practice",
    prompt: "Count each staff member's ENTRY events into restricted galleries. Return full_name and entry_count for anyone with at least two such entries. Use HAVING to filter the grouped counts.",
    expected: [["Dev Malik", "5"]]
  },
  {
    title: "Challenge 11: Above-average artifacts",
    difficulty: "Advanced",
    prompt: "Use a subquery to find artifacts worth more than the average artifact value. Return artifact_name and estimated_value, sorted from highest value to lowest.",
    expected: [["Star of Asterion", "9500000"]]
  },
  {
    title: "Challenge 12: Who scanned the most valuable artifact?",
    difficulty: "Advanced",
    prompt: "Use a subquery to find the most valuable artifact, then find the staff member who made an ALERT_SCAN of it. Return full_name.",
    expected: [["Dev Malik"]]
  }
];

const welcomePage = document.getElementById("welcome-page");
const gamePage = document.getElementById("game-page");
const studentForm = document.getElementById("student-form");
const startButton = document.getElementById("start-btn");
const queryInput = document.getElementById("query-input");
const checkButton = document.getElementById("check-btn");
const nextButton = document.getElementById("next-btn");
const schemaToggle = document.getElementById("schema-toggle");
const schemaPanel = document.getElementById("schema-panel");
const resultMessage = document.getElementById("result");
const queryOutput = document.getElementById("query-output");

function initializeDatabase() {
  if (typeof initSqlJs !== "function") {
    const message = "The SQL engine could not be loaded. Check your internet connection and reload this page.";
    document.getElementById("setup-status").textContent = message;
    console.error(message);
    return;
  }

  initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
  }).then(SQL => {
    database = new SQL.Database();
    database.run(setupSql);
    database.run("PRAGMA query_only = ON;");
    document.getElementById("setup-status").textContent = "Museum evidence loaded. Start when you are ready.";
    startButton.disabled = false;
  }).catch(error => {
    const message = "The SQL engine could not be initialized. Check your internet connection and reload this page.";
    document.getElementById("setup-status").textContent = message;
    console.error(message, error);
  });
}

function startGame() {
  if (!database || gameStarted) return;
  const formStatus = document.getElementById("student-form-status");
  const formData = new FormData(studentForm);
  studentDetails = {
    name: formData.get("studentName").trim(),
    rollNumber: formData.get("rollNumber").trim(),
    department: formData.get("department").trim(),
    section: formData.get("section").trim()
  };

  const emptyField = [...studentForm.elements].find(element =>
    element.required && !element.value.trim()
  );
  if (emptyField) {
    emptyField.setCustomValidity("Please enter a non-empty value.");
    emptyField.reportValidity();
    emptyField.focus();
    formStatus.textContent = "Please complete all student details.";
    return;
  }

  gameStarted = true;
  formStatus.textContent = "";
  const studentSummaryDetails = [
    studentDetails.name,
    `Roll No. ${studentDetails.rollNumber}`,
    studentDetails.department,
    studentDetails.section && `Section ${studentDetails.section}`
  ].filter(Boolean);
  document.getElementById("student-summary").textContent =
    studentSummaryDetails.join(" · ");
  welcomePage.classList.add("hidden");
  gamePage.classList.remove("hidden");
  showChallenge();
  startTimer();
}

function showChallenge() {
  const challenge = challenges[currentChallenge];
  challengePassed = false;
  document.getElementById("clue-title").textContent = challenge.title;
  document.getElementById("clue-text").textContent = challenge.prompt;
  schemaPanel.hidden = true;
  schemaToggle.textContent = "View schema";
  schemaToggle.setAttribute("aria-expanded", "false");
  document.getElementById("progress").textContent =
    `Challenge ${currentChallenge + 1} of ${challenges.length} · ${challenge.difficulty}`;
  queryInput.value = "";
  queryInput.disabled = false;
  checkButton.disabled = false;
  nextButton.disabled = true;
  nextButton.textContent = currentChallenge === challenges.length - 1
    ? "Finish & solve the case"
    : "Next Challenge →";
  resultMessage.textContent = "";
  queryOutput.replaceChildren();
  queryInput.focus();
}

function normalizeRows(rows) {
  return rows
    .map(row => row.map(value => value === null ? "null" : String(value).trim().toLocaleLowerCase()))
    .sort((first, second) => JSON.stringify(first).localeCompare(JSON.stringify(second)));
}

function rowsMatch(actual, expected) {
  return JSON.stringify(normalizeRows(actual)) === JSON.stringify(normalizeRows(expected));
}

function renderResults(columns, rows) {
  queryOutput.replaceChildren();
  if (columns.length === 0) {
    queryOutput.textContent = "Your query returned no rows.";
    return;
  }

  const table = document.createElement("table");
  const head = table.createTHead().insertRow();
  columns.forEach(column => {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = column;
    head.appendChild(cell);
  });

  const body = table.createTBody();
  rows.forEach(row => {
    const tableRow = body.insertRow();
    row.forEach(value => {
      tableRow.insertCell().textContent = value === null ? "NULL" : String(value);
    });
  });
  queryOutput.appendChild(table);
  if (rows.length === 0) queryOutput.insertAdjacentText("beforeend", "Your query returned no rows.");
}

function runQuery() {
  queryOutput.replaceChildren();
  const query = queryInput.value.trim().replace(/;+$/, "").trim();
  if (!query) {
    resultMessage.textContent = "Write a SQL query before running it.";
    return;
  }
  if (!/^(SELECT|WITH)\b/i.test(query) || /;\s*\S/.test(query)) {
    resultMessage.textContent = "Only one read-only SELECT query (or WITH query) is allowed.";
    return;
  }

  try {
    const results = database.exec(query);
    const result = results.length > 0 ? results[results.length - 1] : { columns: [], values: [] };
    renderResults(result.columns, result.values);
    if (rowsMatch(result.values, challenges[currentChallenge].expected)) {
      challengePassed = true;
      queryInput.disabled = true;
      checkButton.disabled = true;
      nextButton.disabled = false;
      resultMessage.textContent = "✅ Correct! You unlocked the next challenge.";
    } else {
      resultMessage.textContent = "Not quite. Check the result and refine your SQL query.";
    }
  } catch (error) {
    resultMessage.textContent = `SQL error: ${error.message}`;
    console.error("The submitted SQL query could not be executed.", error);
  }
}

function advanceChallenge() {
  if (!challengePassed) return;
  currentChallenge++;
  if (currentChallenge < challenges.length) {
    showChallenge();
  } else {
    celebrate();
  }
}

function startTimer() {
  const timerDisplay = document.getElementById("timer");
  timer = setInterval(() => {
    totalSeconds--;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (totalSeconds <= 0) {
      clearInterval(timer);
      timerDisplay.textContent = "⏱️ Time’s up!";
      queryInput.disabled = true;
      checkButton.disabled = true;
      nextButton.disabled = true;
      resultMessage.textContent = "Time is up. Refresh the page to start a new investigation.";
      return;
    }
    timerDisplay.textContent =
      `⏱️ ${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, 1000);
}

function celebrate() {
  clearInterval(timer);
  const clueContainer = document.getElementById("clue-container");
  clueContainer.replaceChildren();

  const greeting = document.createElement("h2");
  greeting.textContent = `🎉 Congratulations, ${studentDetails.name}! 🎉`;
  clueContainer.appendChild(greeting);

  const completionMessage = document.createElement("p");
  completionMessage.textContent =
    "You completed all 12 SQL challenges and uncovered the truth about the Star of Asterion.";
  clueContainer.appendChild(completionMessage);

  const certificate = document.createElement("article");
  certificate.id = "certificate";
  certificate.className = "certificate";

  const collegeHeading = document.createElement("div");
  collegeHeading.className = "certificate-college-heading";

  const collegeLogo = document.createElement("img");
  collegeLogo.className = "certificate-logo";
  collegeLogo.src = "caslogo.png";
  collegeLogo.alt = "KG College of Arts and Science logo";
  collegeHeading.appendChild(collegeLogo);

  const collegeName = document.createElement("h2");
  collegeName.className = "certificate-college-name";
  collegeName.textContent = "KG College of Arts and Science";
  collegeHeading.appendChild(collegeName);
  certificate.appendChild(collegeHeading);

  const certificateOrganizer = document.createElement("p");
  certificateOrganizer.className = "certificate-organizer";
  certificateOrganizer.textContent = "Technical Training Team";
  certificate.appendChild(certificateOrganizer);

  const certificatePresents = document.createElement("p");
  certificatePresents.className = "certificate-presents";
  certificatePresents.textContent = "presents";
  certificate.appendChild(certificatePresents);

  const mysteryTitle = document.createElement("p");
  mysteryTitle.className = "certificate-mystery-title";
  mysteryTitle.textContent = "SQL Mystery: The Vanishing Star";
  certificate.appendChild(mysteryTitle);

  const certificateTitle = document.createElement("h2");
  certificateTitle.textContent = "Certificate of Achievement";
  certificate.appendChild(certificateTitle);

  const certificateIntro = document.createElement("p");
  certificateIntro.className = "certificate-intro";
  certificateIntro.textContent = "This certificate is proudly presented to";
  certificate.appendChild(certificateIntro);

  const certificateName = document.createElement("p");
  certificateName.className = "certificate-name";
  certificateName.textContent = studentDetails.name;
  certificate.appendChild(certificateName);

  const certificateDescription = document.createElement("p");
  certificateDescription.className = "certificate-description";
  certificateDescription.textContent =
    "for successfully completing all 12 challenges in The Vanishing Star SQL Mystery.";
  certificate.appendChild(certificateDescription);

  const studentInfo = document.createElement("div");
  studentInfo.className = "certificate-details";
  [
    ["Roll Number", studentDetails.rollNumber],
    ["Department", studentDetails.department],
    ["Section", studentDetails.section]
  ].filter(([, value]) => value).forEach(([label, value]) => {
    const detail = document.createElement("p");
    const detailLabel = document.createElement("strong");
    detailLabel.textContent = `${label}: `;
    detail.append(detailLabel, document.createTextNode(value));
    studentInfo.appendChild(detail);
  });
  certificate.appendChild(studentInfo);

  const certificateFooter = document.createElement("p");
  certificateFooter.className = "certificate-footer";
  certificateFooter.textContent = "SQL Mystery: The Vanishing Star";
  certificate.appendChild(certificateFooter);
  clueContainer.appendChild(certificate);

  const printButton = document.createElement("button");
  printButton.className = "btn";
  printButton.type = "button";
  printButton.textContent = "🖨️ Print / Save as PDF";
  printButton.addEventListener("click", () => window.print());
  clueContainer.appendChild(printButton);

  if (typeof confetti !== "function") {
    console.error("The confetti animation could not be loaded.");
    return;
  }
  const duration = 5000;
  const end = Date.now() + duration;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 100, origin: { x: 0 } });
    confetti({ particleCount: 4, angle: 120, spread: 100, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

studentForm.addEventListener("input", event => {
  if (event.target instanceof HTMLInputElement) {
    event.target.setCustomValidity("");
    document.getElementById("student-form-status").textContent = "";
  }
});
studentForm.addEventListener("submit", event => {
  event.preventDefault();
  startGame();
});
checkButton.addEventListener("click", runQuery);
nextButton.addEventListener("click", advanceChallenge);
schemaToggle.addEventListener("click", () => {
  const isExpanded = schemaToggle.getAttribute("aria-expanded") === "true";
  schemaPanel.hidden = isExpanded;
  schemaToggle.setAttribute("aria-expanded", String(!isExpanded));
  schemaToggle.textContent = isExpanded ? "View schema" : "Hide schema";
});
queryInput.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") runQuery();
});
initializeDatabase();
