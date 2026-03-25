// quiz.js

const HARDCODED_QUESTIONS = [
  {
    question: "When you imagine yourself 5 years from now, what does your day look like?",
    options: [
      "Solving deep technical problems alone",
      "Leading a team building something big",
      "Researching something no one fully understands yet",
      "Creating tools that directly help people",
      "I genuinely have no idea"
    ]
  },
  {
    question: "Which of these tasks would you actually enjoy doing for hours?",
    options: [
      "Debugging why a system broke",
      "Designing how something should work",
      "Analyzing patterns in large datasets",
      "Building something you can see and use",
      "Reading about how technologies work conceptually"
    ]
  },
  {
    question: "Be honest — what's your relationship with mathematics?",
    options: [
      "I genuinely enjoy it, it comes naturally",
      "I can do it but I wouldn't choose it",
      "I find it painful but I push through",
      "I actively avoid it wherever possible"
    ]
  }
];

const QUESTION_SYSTEM_PROMPT = `You are a career guidance AI for Computer Science students. Your job is to ask one deep, psychologically insightful question at a time to understand a student's strengths, cognitive style, work preferences, values, and behavioral tendencies.

Rules:
- Ask only ONE question per response
- Provide exactly 4 answer options
- Questions must be progressively deeper based on previous answers
- Never repeat themes already covered
- Questions should feel slightly uncomfortable — they should make the user think, not just pick an easy answer
- Do not mention specific career paths in the questions — stay behavioral and psychological
- Keep question text under 25 words
- Keep each option under 10 words

Respond in this exact JSON format:
{
  "question": "question text here",
  "options": ["option 1", "option 2", "option 3", "option 4"]
}`;

const FINAL_ANALYSIS_PROMPT = `You are a career guidance AI. Based on the conversation history provided, analyze the user's psychological profile, cognitive style, strengths, and preferences. Generate exactly 3 CS career path recommendations.

Rules:
- Recommendation 1: strongest overall match (strength-based)
- Recommendation 2: best interest/passion match
- Recommendation 3: a hybrid or surprising but valid match
- Percentages must be independent match scores (not summing to 100)
- Round percentages to nearest 5. Min 55, max 95. No two the same.
- Career paths are NOT limited to a preset list — suggest any valid CS specialization
- Do not add disclaimers or hedging language
- Be direct and confident

Respond in this exact JSON format:
{
  "results": [
    {
      "rank": 1,
      "field": "field name",
      "percentage": 90,
      "type": "Strength-based recommendation",
      "explanation": "3-5 sentence explanation of why this fits them specifically based on their answers",
      "strengths": ["tag1", "tag2", "tag3"],
      "considerations": ["tag1", "tag2"]
    },
    { "rank": 2, ... },
    { "rank": 3, ... }
  ]
}`;

// State
let currentQuestionIndex = 0;
const totalQuestions = 25;
let conversationHistory = [
  { role: "system", content: QUESTION_SYSTEM_PROMPT }
];
let currentQuestion = null;
let isGenerating = false;

// DOM Elements
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

// Messages loop
const loadingMessages = [
  "Reading between the lines...",
  "Building your profile...",
  "Thinking deeper...",
  "Connecting patterns..."
];
let msgInterval;

async function callOpenAI(messages, maxRetries = 2) {
  let retries = 0;
  while (retries <= maxRetries) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${typeof OPENAI_API_KEY !== 'undefined' ? OPENAI_API_KEY : ''}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messages,
          max_tokens: 800,
          temperature: 0.7,
          response_format: { type: "json_object" }
        })
      });
      
      if (!response.ok) throw new Error("API response not ok");
      
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error(e);
      retries++;
      if (retries > maxRetries) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

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
  }, 300); // Small transition
}

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

function renderQuestion() {
  questionText.textContent = currentQuestion.question;
  optionsContainer.innerHTML = '';
  optionsContainer.style.display = 'flex';
  
  // Custom fade in
  questionText.style.opacity = 0;
  questionText.style.transform = 'translateY(10px)';
  setTimeout(() => {
    questionText.style.transition = 'all 0.4s ease';
    questionText.style.opacity = 1;
    questionText.style.transform = 'translateY(0)';
  }, 50);

  currentQuestion.options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.style.opacity = 0;
    btn.style.transform = 'translateY(10px)';
    
    // Staggered reveal
    setTimeout(() => {
      btn.style.transition = 'all 0.3s ease';
      btn.style.opacity = 1;
      btn.style.transform = 'translateY(0)';
    }, 100 + (index * 50));
    
    btn.onclick = () => handleSelectOption(btn, opt);
    optionsContainer.appendChild(btn);
  });
  
  backBtn.style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none';
  optionalContainer.style.display = 'none';
  updateProgress();
}

async function handleSelectOption(btn, selectedOption) {
  if (isGenerating) return;
  
  // Visual state
  document.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  
  // Append to history
  conversationHistory.push({ role: "assistant", content: JSON.stringify(currentQuestion) });
  conversationHistory.push({ role: "user", content: selectedOption });
  
  currentQuestionIndex++;
  
  // Highlight briefly before advancing
  setTimeout(advanceStep, 600);
}

async function advanceStep() {
  if (currentQuestionIndex < 3) {
    // Show next hardcoded question
    currentQuestion = HARDCODED_QUESTIONS[currentQuestionIndex];
    renderQuestion();
  } else if (currentQuestionIndex < totalQuestions) {
    // Generate next question via AI
    startLoading();
    
    // Ensure 1.5s min load time
    const startT = Date.now();
    try {
      const gptNext = await callOpenAI(conversationHistory);
      currentQuestion = gptNext;
      
      const diff = Date.now() - startT;
      if (diff < 1500) await new Promise(r => setTimeout(r, 1500 - diff));
      
      stopLoading();
      renderQuestion();
    } catch (e) {
      alert("Error generating next question. Please try again or check API key.");
      stopLoading();
      currentQuestionIndex--;
      conversationHistory.splice(-2, 2); // Revert failed save
      document.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
    }
  } else {
    // Q26 - Optional Step
    showOptionalStep();
  }
}

function showOptionalStep() {
  updateProgress();
  questionText.textContent = "Anything else you'd like us to know?";
  optionsContainer.style.display = 'none';
  optionalContainer.style.display = 'block';
  backBtn.style.display = 'inline-block';
}

async function handleFinalSubmit(optionalText) {
  if (optionalText && optionalText.trim().length > 0) {
    conversationHistory.push({ role: "user", content: `Additional context: ${optionalText}` });
  }
  
  // Replace the system prompt for final analysis
  const finalMessages = [...conversationHistory];
  finalMessages[0] = { role: "system", content: FINAL_ANALYSIS_PROMPT };
  
  fullLoader.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  try {
    const finalData = await callOpenAI(finalMessages, 3);
    sessionStorage.setItem('pathifyResults', JSON.stringify(finalData));
    window.location.href = 'results.html';
  } catch (e) {
    alert("Error generating your roadmap. Please check your API key and try again.");
    fullLoader.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Handlers
backBtn.onclick = () => {
  if (isGenerating || currentQuestionIndex === 0) return;
  currentQuestionIndex--;
  // pop user response and the question config
  if (conversationHistory.length >= 3) {
      conversationHistory.splice(-2, 2);
  }
  
  if (currentQuestionIndex < 3) {
    currentQuestion = HARDCODED_QUESTIONS[currentQuestionIndex];
  } else if (conversationHistory.length > 0) {
    // We get the last question from history
    const lastAsst = conversationHistory[conversationHistory.length - 1];
    if (lastAsst.role === "assistant") {
      try {
        currentQuestion = JSON.parse(lastAsst.content);
        conversationHistory.pop(); // Remove it so user can answer again
      } catch (e) { }
    }
  }
  renderQuestion();
};

submitBtn.onclick = () => handleFinalSubmit(optionalInput.value);
skipBtn.onclick = () => handleFinalSubmit("");

// Init
window.addEventListener('DOMContentLoaded', () => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-key-here') {
    alert("Please update config.js with a valid OPENAI_API_KEY to test AI generation.");
  }
  currentQuestion = HARDCODED_QUESTIONS[0];
  renderQuestion();
});
