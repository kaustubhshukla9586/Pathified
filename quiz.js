// quiz.js — Batch-of-4 Quiz Engine

// ==========================================
// HARDCODED QUESTIONS (Q1–Q3)
// ==========================================
const HARDCODED_QUESTIONS = [
  {
    question: "It's 11pm. You have no deadline, no one is checking on you. What are you most likely doing on your laptop?",
    options: [
      "Going deep into something that broke and figuring out why",
      "Building something small just to see if I can",
      "Reading or watching something to understand how things work",
      "Planning or organising something — a project, a system, an idea"
    ],
    category: "PERSONALITY"
  },
  {
    question: "Your college gives you 6 free months — no classes, no exams, no pressure. You have to work on something CS related. What do you actually do?",
    options: [
      "Build a real working product, even if it's messy",
      "Go deep into one topic I never had time to properly understand",
      "Find a real problem around me and try to solve it with code",
      "Learn whatever gets me the best job after this"
    ],
    category: "SITUATION"
  },
  {
    question: "Be honest — when you hit a really hard math or logic problem in your coursework, what actually happens?",
    options: [
      "I get stuck in it until I figure it out, I can't let it go",
      "I understand it when someone explains it but I won't go looking for more",
      "I get through it because I have to but I don't enjoy it",
      "I find a way around it or look for the answer — I'd rather spend time elsewhere"
    ],
    category: "CSE DISCIPLINE"
  }
];

// ==========================================
// SYSTEM PROMPTS
// ==========================================
const QUESTION_SYSTEM_PROMPT = `You are a career guidance AI helping Computer Science students figure out which field of CS actually fits them. You ask questions one batch at a time. Each batch of 4 questions must be generated together, based on everything the student has answered so far.

Your questions must cover these 4 categories — one question per category per batch, in any order:
1. PERSONALITY — how this person thinks, what drives them, what they fear, what kind of work energises or drains them
2. SITUATION — a real scenario (college life or workplace) where they have to make a choice or react. Describe the situation in 2-3 simple sentences then ask what they would do
3. CSE DISCIPLINE — something directly related to CS topics, subjects, or skills. Ask about their real experience or honest feelings about things like algorithms, building systems, data, networks, security, design, etc
4. VALUES — what they actually care about: money, impact, recognition, learning, stability, freedom, competition

Rules for questions:
- Use simple, everyday English. Imagine you are texting a friend, not writing a report. No big words.
- Every question must feel like it was written specifically for this person based on what they already said
- Situation questions must describe a real scenario first (2-3 sentences), then ask what the person would do
- Never ask the same theme twice across the whole quiz
- Questions should make the person pause and actually think — not give an easy answer
- Do not mention specific career paths or job titles in questions
- The 4 options for each question must feel genuinely different from each other
- One of the 4 options should always be the honest uncomfortable answer that people think but don't usually say
- No option should feel like the "obviously correct" answer
- If the user added any extra text context to a previous answer, use that context to make this batch more specific and personal

Keep question text between 15-40 words.
Keep each option under 15 words.
Use simple words a non-native English speaker can understand.

Respond with exactly this JSON format — all 4 questions in one response, no extra text:
{
  "batch": [
    {
      "question": "question text",
      "options": ["option 1", "option 2", "option 3", "option 4"],
      "category": "PERSONALITY"
    },
    {
      "question": "question text",
      "options": ["option 1", "option 2", "option 3", "option 4"],
      "category": "SITUATION"
    },
    {
      "question": "question text",
      "options": ["option 1", "option 2", "option 3", "option 4"],
      "category": "CSE DISCIPLINE"
    },
    {
      "question": "question text",
      "options": ["option 1", "option 2", "option 3", "option 4"],
      "category": "VALUES"
    }
  ]
}`;

const FINAL_ANALYSIS_PROMPT = `You are a career guidance AI. You have just finished a deep quiz with a CS student. Based on everything they answered — including any extra context they typed — analyse their full profile and give them 3 specific CS career path recommendations.

Rules:
- Each recommendation must be a specific, real field within CS — not a vague label like "tech leadership" or "software development"
- Good examples of specific fields: Machine Learning Engineering, Cybersecurity & Ethical Hacking, Frontend Engineering, DevOps & Cloud Infrastructure, Data Engineering, Embedded Systems, Game Development, NLP & Conversational AI, Computer Vision, Blockchain Development, Mobile Development, Systems Programming
- Recommendation 1: the field that best matches their natural strengths based on how they think and work
- Recommendation 2: the field that best matches what they seem genuinely interested in and excited by
- Recommendation 3: a field that combines both, or one that might surprise them but fits well based on their answers
- Percentages are independent match scores — they do not add up to 100
- Round all percentages to nearest 5. Minimum 55, maximum 95. No two can be the same.
- The explanation must feel personal — reference things they actually said or chose. Use simple, clear English.
- Strengths: 3 short tags describing why this field suits them specifically
- Considerations (weaknesses): 2 short tags — phrased softly, like "something worth being aware of"
- Specific roles: 3 actual job titles within that field they could realistically aim for
- Do not use disclaimers. Do not hedge. Be direct and confident but warm.

Respond in exactly this JSON format with all 3 results fully complete:
{
  "results": [
    {
      "rank": 1,
      "field": "specific field name",
      "percentage": 90,
      "type": "Strength-based recommendation",
      "explanation": "3-5 sentence personal explanation referencing their actual answers in simple English",
      "strengths": ["tag1", "tag2", "tag3"],
      "considerations": ["something worth being aware of 1", "something worth being aware of 2"],
      "roles": ["Job Title 1", "Job Title 2", "Job Title 3"]
    },
    {
      "rank": 2,
      "field": "specific field name",
      "percentage": 80,
      "type": "Interest-based recommendation",
      "explanation": "3-5 sentence personal explanation",
      "strengths": ["tag1", "tag2", "tag3"],
      "considerations": ["something worth being aware of 1", "something worth being aware of 2"],
      "roles": ["Job Title 1", "Job Title 2", "Job Title 3"]
    },
    {
      "rank": 3,
      "field": "specific field name",
      "percentage": 70,
      "type": "Hybrid recommendation",
      "explanation": "3-5 sentence personal explanation",
      "strengths": ["tag1", "tag2", "tag3"],
      "considerations": ["something worth being aware of 1", "something worth being aware of 2"],
      "roles": ["Job Title 1", "Job Title 2", "Job Title 3"]
    }
  ]
}`;

// ==========================================
// STATE
// ==========================================
let currentQuestionIndex = 0;
let currentBatchIndex = 0;
let questionBatch = [];
const totalQuestions = 25; // 3 hardcoded + 5 batches of 4 (=20) + 2 spare = 25
let conversationHistory = [
  { role: "system", content: QUESTION_SYSTEM_PROMPT }
];
let allAnswers = []; // { question, answer, extraContext, category }
let currentQuestion = null;
let isGenerating = false;

// ==========================================
// CACHE / RESUME
// ==========================================
function saveProgress() {
  localStorage.setItem('pathified_progress', JSON.stringify({
    currentQuestionIndex,
    currentBatchIndex,
    questionBatch,
    allAnswers,
    conversationHistory
  }));
}

function restoreProgress() {
  const saved = localStorage.getItem('pathified_progress');
  if (!saved) return false;
  try {
    const state = JSON.parse(saved);
    currentQuestionIndex = state.currentQuestionIndex;
    currentBatchIndex = state.currentBatchIndex;
    questionBatch = state.questionBatch || [];
    allAnswers = state.allAnswers || [];
    conversationHistory = state.conversationHistory || [
      { role: "system", content: QUESTION_SYSTEM_PROMPT }
    ];
    return true;
  } catch (e) {
    return false;
  }
}

function clearProgress() {
  localStorage.removeItem('pathified_progress');
}

// ==========================================
// DOM ELEMENTS
// ==========================================
const innerEls = document.getElementById('quiz-inner');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const progressBar = document.getElementById('progress-bar');
const questionCounter = document.getElementById('question-counter');
const backBtn = document.getElementById('back-btn');
const loadingOverlay = document.getElementById('loading-overlay');
const fullLoader = document.getElementById('full-loader');
const loadingText = document.getElementById('loading-text');

const optionalContainer = document.getElementById('optional-container');
const optionalInput = document.getElementById('optional-input');
const submitBtn = document.getElementById('submit-btn');
const skipBtn = document.getElementById('skip-btn');
const summaryScreen = document.getElementById('summary-screen');
const traitsContainer = document.getElementById('traits-container');

// ==========================================
// LOADING MESSAGES
// ==========================================
const loadingMessages = [
  "Reading between the lines...",
  "Building your profile...",
  "Thinking deeper...",
  "Connecting patterns...",
  "Analysing your style..."
];
let msgInterval;

// ==========================================
// API CALL (via vercel function)
// ==========================================
async function callGroq(messages, maxRetries = 2) {
  let retries = 0;
  while (retries <= maxRetries) {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages })
      });

      const data = await response.json();

      // Log what we actually got back
      console.log("API response status:", response.status);
      console.log("API response data:", JSON.stringify(data));

      if (!response.ok) {
        throw new Error(`Server error ${response.status}: ${data.error || JSON.stringify(data)}`);
      }

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error("Unexpected response shape:", JSON.stringify(data));
        throw new Error("Unexpected response from API: " + JSON.stringify(data));
      }

      const text = data.choices[0].message.content;
      const cleaned = text.replace(/```json[\s\S]*?```|```[\s\S]*?```/g, match => {
        return match.replace(/```json\n?|```\n?/g, '').trim();
      }).trim();

      return JSON.parse(cleaned);

    } catch (e) {
      console.error("callGroq error (attempt " + (retries + 1) + "):", e.message);
      retries++;
      if (retries > maxRetries) throw e;
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

// ==========================================
// FETCH NEXT BATCH OF 4 QUESTIONS
// ==========================================
async function fetchNextBatch() {
  const contextSummary = allAnswers.map((a, i) =>
    `Q${i + 1} [${a.category || 'GENERAL'}]: ${a.question}\nAnswer: ${a.answer}${a.extraContext ? `\nExtra context: ${a.extraContext}` : ''}`
  ).join('\n\n');

  const messages = [
    { role: "system", content: QUESTION_SYSTEM_PROMPT },
    { role: "user", content: `Here are all the answers so far:\n\n${contextSummary}\n\nGenerate the next batch of 4 questions. Each question must be in a different category: PERSONALITY, SITUATION, CSE DISCIPLINE, VALUES. Base the questions on everything above. You MUST respond with valid JSON only containing a "batch" array of exactly 4 questions.` }
  ];

  const parsed = await callGroq(messages);

  // Defensive: handle different response shapes the AI might return
  let batch = null;

  if (parsed && Array.isArray(parsed.batch)) {
    batch = parsed.batch;
  } else if (parsed && Array.isArray(parsed.questions)) {
    batch = parsed.questions;
  } else if (Array.isArray(parsed)) {
    batch = parsed;
  }

  // Validate batch exists and has items
  if (!batch || !Array.isArray(batch) || batch.length === 0) {
    throw new Error('AI returned an invalid batch format. Please try again.');
  }

  // Filter out any malformed questions
  const valid = batch.filter(q => q && q.question && Array.isArray(q.options) && q.options.length >= 2);
  if (valid.length === 0) {
    throw new Error('AI returned questions with missing fields. Please try again.');
  }

  // Fill category if missing
  const categories = ['PERSONALITY', 'SITUATION', 'CSE DISCIPLINE', 'VALUES'];
  valid.forEach((q, i) => {
    if (!q.category) q.category = categories[i % categories.length];
  });

  return valid;
}

// ==========================================
// LOADING UI
// ==========================================
function startLoading() {
  isGenerating = true;
  loadingOverlay.style.display = 'block';
  innerEls.style.opacity = '0';
  backBtn.disabled = true;

  let msgIdx = 0;
  loadingText.textContent = loadingMessages[msgIdx];
  msgInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % loadingMessages.length;
    loadingText.textContent = loadingMessages[msgIdx];
  }, 2000);
}

function stopLoading() {
  isGenerating = false;
  clearInterval(msgInterval);
  setTimeout(() => {
    loadingOverlay.style.display = 'none';
    innerEls.style.opacity = '1';
    backBtn.disabled = false;
  }, 300);
}

// ==========================================
// PROGRESS BAR
// ==========================================
function updateProgress() {
  const qNum = currentQuestionIndex + 1;
  const pct = (qNum / totalQuestions) * 100;
  progressBar.style.width = `${pct}%`;
  if (qNum <= totalQuestions) {
    questionCounter.textContent = `Question ${qNum} of ${totalQuestions}`;
  } else {
    questionCounter.textContent = "Final Thoughts";
    progressBar.style.width = `100%`;
  }
}

// ==========================================
// RENDER QUESTION
// ==========================================
function renderQuestion() {
  questionText.textContent = currentQuestion.question;
  optionsContainer.innerHTML = '';
  optionsContainer.style.display = 'grid';

  // Remove any previous pen toggle / extra box
  const oldPen = document.querySelector('.pen-toggle');
  const oldBox = document.querySelector('.extra-context-box');
  if (oldPen) oldPen.remove();
  if (oldBox) oldBox.remove();

  // Fade in question
  questionText.style.opacity = 0;
  questionText.style.transform = 'translateY(10px)';
  setTimeout(() => {
    questionText.style.transition = 'all 0.4s ease';
    questionText.style.opacity = 1;
    questionText.style.transform = 'translateY(0)';
  }, 50);

  // Render option buttons
  currentQuestion.options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.style.opacity = 0;
    btn.style.transform = 'translateY(10px)';

    setTimeout(() => {
      btn.style.transition = 'all 0.3s ease';
      btn.style.opacity = 1;
      btn.style.transform = 'translateY(0)';
    }, 100 + (index * 50));

    btn.onclick = () => handleSelectOption(btn, opt);
    optionsContainer.appendChild(btn);
  });

  // --- Pen icon + expandable text box ---
  const penToggle = document.createElement('button');
  penToggle.className = 'pen-toggle';
  penToggle.innerHTML = '✏️ Add context';
  penToggle.title = 'Add more context to your answer';

  const extraBox = document.createElement('textarea');
  extraBox.className = 'extra-context-box';
  extraBox.placeholder = 'Add anything extra here — the more specific you are, the better your result will be...';
  extraBox.style.display = 'none';
  extraBox.id = 'current-extra-context';

  penToggle.onclick = (e) => {
    e.preventDefault();
    const isHidden = extraBox.style.display === 'none';
    extraBox.style.display = isHidden ? 'block' : 'none';
    penToggle.textContent = isHidden ? '✏️ Hide context box' : '✏️ Add context';
  };

  optionsContainer.after(penToggle);
  penToggle.after(extraBox);

  // Update UI
  backBtn.style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none';
  optionalContainer.style.display = 'none';
  updateProgress();
}

function animateQuestionTransition(renderFn) {
  innerEls.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
  innerEls.style.opacity = '0';
  innerEls.style.transform = 'translateY(12px)';

  setTimeout(() => {
    renderFn();
    innerEls.style.opacity = '1';
    innerEls.style.transform = 'translateY(0)';
  }, 200);
}

// ==========================================
// HANDLE OPTION SELECTION
// ==========================================
async function handleSelectOption(btn, selectedOption) {
  if (isGenerating) return;

  // Visual feedback
  document.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  // Grab extra context if any
  const extraEl = document.getElementById('current-extra-context');
  const extraContext = extraEl ? extraEl.value.trim() : '';

  // Record answer
  allAnswers.push({
    question: currentQuestion.question,
    answer: selectedOption,
    extraContext: extraContext || '',
    category: currentQuestion.category || 'GENERAL'
  });

  // Also append to conversationHistory for final analysis
  const historyContent = selectedOption + (extraContext ? ` [Extra context: ${extraContext}]` : '');
  conversationHistory.push({ role: "assistant", content: JSON.stringify(currentQuestion) });
  conversationHistory.push({ role: "user", content: historyContent });

  currentQuestionIndex++;
  saveProgress();

  // Brief highlight before advancing
  setTimeout(advanceStep, 600);
}

// ==========================================
// ADVANCE STEP
// ==========================================
async function advanceStep() {
  if (currentQuestionIndex < 3) {
    // Hardcoded questions
    currentQuestion = HARDCODED_QUESTIONS[currentQuestionIndex];
    animateQuestionTransition(renderQuestion);
  } else if (currentQuestionIndex < totalQuestions) {
    // Check if current batch has more questions
    if (currentBatchIndex < questionBatch.length) {
      // Serve from batch — no API call
      currentQuestion = questionBatch[currentBatchIndex];
      currentBatchIndex++;
      saveProgress();
      animateQuestionTransition(renderQuestion);
    } else {
      // Need a new batch from AI
      startLoading();
      const startT = Date.now();
      try {
        const batch = await fetchNextBatch();
        questionBatch = batch;
        currentBatchIndex = 0;

        currentQuestion = questionBatch[currentBatchIndex];
        currentBatchIndex++;

        // Ensure minimum 1.5s loading
        const diff = Date.now() - startT;
        if (diff < 1500) await new Promise(r => setTimeout(r, 1500 - diff));

        saveProgress();
        stopLoading();
        animateQuestionTransition(renderQuestion);
      } catch (e) {
        console.error(e);
        alert("Error generating next questions: " + e.message);
        stopLoading();
        // Revert
        currentQuestionIndex--;
        allAnswers.pop();
        if (conversationHistory.length >= 3) conversationHistory.splice(-2, 2);
        document.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
      }
    }
  } else {
    // Q26 — Optional
    showOptionalStep();
  }
}

// ==========================================
// Q26 OPTIONAL STEP
// ==========================================
function showOptionalStep() {
  updateProgress();
  questionText.textContent = "Anything else you'd like us to know?";
  optionsContainer.style.display = 'none';
  optionalContainer.style.display = 'block';
  backBtn.style.display = 'inline-block';

  // Remove pen toggle/box if present
  const oldPen = document.querySelector('.pen-toggle');
  const oldBox = document.querySelector('.extra-context-box');
  if (oldPen) oldPen.remove();
  if (oldBox) oldBox.remove();
}

// ==========================================
// FINAL SUBMIT
// ==========================================
async function handleFinalSubmit(optionalText) {
  if (optionalText?.trim()) {
    conversationHistory.push({
      role: "user",
      content: `Additional context: ${optionalText.trim()}`
    });
  }

  innerEls.style.display = 'none';
  if (summaryScreen) summaryScreen.style.display = 'flex';

  if (traitsContainer) traitsContainer.innerHTML = '';
  try {
    const traits = await showProgressSummary();
    if (traitsContainer && Array.isArray(traits)) {
      traits.forEach((trait, i) => {
        const tag = document.createElement('div');
        tag.className = 'trait-tag';
        tag.textContent = trait;
        tag.style.animationDelay = `${i * 0.15}s`;
        traitsContainer.appendChild(tag);
      });
    }
  } catch (e) {
    console.error('Summary trait generation failed:', e);
  }

  await new Promise((r) => setTimeout(r, 3000));
  if (summaryScreen) summaryScreen.style.display = 'none';

  // Build full context summary for analysis
  const contextSummary = allAnswers.map((a, i) =>
    `Q${i + 1} [${a.category}]: ${a.question}\nAnswer: ${a.answer}${a.extraContext ? `\nExtra context: ${a.extraContext}` : ''}`
  ).join('\n\n');

  const finalMessages = [
    { role: "system", content: FINAL_ANALYSIS_PROMPT },
    { role: "user", content: `Here is the full quiz conversation:\n\n${contextSummary}${optionalText && optionalText.trim() ? `\n\nAdditional context from user: ${optionalText.trim()}` : ''}\n\nAnalyse this person and generate 3 career path recommendations.` }
  ];

  fullLoader.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  try {
    const finalData = await callGroq(finalMessages, 3);
    clearProgress();
    sessionStorage.setItem('pathifiedResults', JSON.stringify(finalData));
    window.location.href = 'results.html';
  } catch (e) {
    alert("Error generating your results. Please try again.");
    fullLoader.style.display = 'none';
    if (summaryScreen) summaryScreen.style.display = 'none';
    innerEls.style.display = 'flex';
    document.body.style.overflow = '';
  }
}

async function showProgressSummary() {
  const traitMessages = [
    ...conversationHistory,
    {
      role: "user",
      content: 'Based on all the answers above, identify exactly 4 short personality or work-style traits this person has shown. Each trait must be 2-4 words maximum. Simple, direct language. No career fields. Return ONLY a JSON array of 4 strings, nothing else: ["trait1", "trait2", "trait3", "trait4"]'
    }
  ];

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: traitMessages })
  });

  if (!response.ok) throw new Error('Trait API request failed');
  const data = await response.json();
  const text = data.choices[0].message.content;
  const cleaned = text.replace(/```json|```/g, '').trim();
  const traits = JSON.parse(cleaned);
  return Array.isArray(traits) ? traits.slice(0, 4) : [];
}

// ==========================================
// BACK BUTTON
// ==========================================
backBtn.onclick = () => {
  if (isGenerating || currentQuestionIndex === 0) return;

  currentQuestionIndex--;

  // Remove last answer
  if (allAnswers.length > 0) allAnswers.pop();

  // Remove last conversation pair
  if (conversationHistory.length >= 3) conversationHistory.splice(-2, 2);

  // Figure out which question to show
  if (currentQuestionIndex < 3) {
    currentQuestion = HARDCODED_QUESTIONS[currentQuestionIndex];
  } else {
    // Go back one within the batch
    if (currentBatchIndex > 0) {
      currentBatchIndex--;
    }
    // The current question is the one at the decremented batch index
    if (questionBatch.length > 0 && currentBatchIndex < questionBatch.length) {
      currentQuestion = questionBatch[currentBatchIndex];
    }
  }

  saveProgress();
  renderQuestion();
};

// ==========================================
// SUBMIT / SKIP HANDLERS
// ==========================================
submitBtn.onclick = () => handleFinalSubmit(optionalInput.value);
skipBtn.onclick = () => handleFinalSubmit("");

// ==========================================
// INIT
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  const resumed = restoreProgress();
  if (resumed && currentQuestionIndex > 0) {
    // Restored — figure out which question to show
    if (currentQuestionIndex < 3) {
      currentQuestion = HARDCODED_QUESTIONS[currentQuestionIndex];
    } else if (currentQuestionIndex >= totalQuestions) {
      showOptionalStep();
      return;
    } else if (questionBatch.length > 0 && currentBatchIndex > 0 && currentBatchIndex <= questionBatch.length) {
      // We were in the middle of a batch
      currentQuestion = questionBatch[currentBatchIndex - 1];
    } else {
      // Edge case — start fresh
      currentQuestionIndex = 0;
      currentBatchIndex = 0;
      questionBatch = [];
      allAnswers = [];
      conversationHistory = [{ role: "system", content: QUESTION_SYSTEM_PROMPT }];
      currentQuestion = HARDCODED_QUESTIONS[0];
    }
    renderQuestion();
  } else {
    // Fresh start
    currentQuestion = HARDCODED_QUESTIONS[0];
    renderQuestion();
  }
});