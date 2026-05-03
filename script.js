/* ========================================
   TYPING SPEED TEST - JAVASCRIPT
   ========================================
   This file handles all the logic:
   1. Displaying a random paragraph
   2. Tracking user input character by character
   3. Running a countdown timer
   4. Calculating WPM, CPM, Accuracy, Mistakes
   5. Saving best score & history in localStorage
   ======================================== */

// ============ PARAGRAPHS TO TYPE ============
// Array of sample paragraphs - one is chosen randomly for each test
var paragraphs = [
    "The quick brown fox jumps over the lazy dog near the river bank. Every morning the fox would go out to find food for its family. The dog would simply watch and yawn.",
    "Technology has changed the way we live and work. Computers and smartphones are now essential tools that help us communicate and solve problems every single day.",
    "Education is the most powerful weapon which you can use to change the world. A good teacher can inspire hope and ignite the imagination of every student in the classroom.",
    "JavaScript is a popular programming language used to create interactive websites. It runs in the browser and allows developers to build dynamic and engaging user experiences.",
    "Practice makes perfect when it comes to typing. The more you type the faster and more accurate you become. Set a goal and try to improve your speed every single day.",
    "The sun sets behind the mountains painting the sky in shades of orange and purple. Birds fly home to their nests while the world slowly prepares for the calm of the night.",
    "Web development is a valuable skill in the modern world. Learning HTML CSS and JavaScript opens up many career opportunities in the growing field of information technology.",
    "A journey of a thousand miles begins with a single step. Stay focused on your goals and work hard every day. Success comes to those who are patient and never give up.",
    "Clean code is easy to read and understand. Good programmers write code that other people can follow. Comments and proper naming make the code more maintainable and useful.",
    "The internet connects billions of people around the world. It has made sharing knowledge and information faster than ever before. It continues to shape the future of communication."
];

// ============ GET HTML ELEMENTS ============
// We use document.getElementById to connect HTML elements to JavaScript variables
var textDisplay    = document.getElementById("textDisplay");
var typingInput    = document.getElementById("typingInput");
var timerDisplay   = document.getElementById("timerDisplay");
var liveWpm        = document.getElementById("liveWpm");
var liveCpm        = document.getElementById("liveCpm");
var liveMistakes   = document.getElementById("liveMistakes");
var progressBar    = document.getElementById("progressBar");
var restartBtn     = document.getElementById("restartBtn");
var newTextBtn     = document.getElementById("newTextBtn");
var resultCard     = document.getElementById("resultCard");
var resultWpm      = document.getElementById("resultWpm");
var resultCpm      = document.getElementById("resultCpm");
var resultAccuracy = document.getElementById("resultAccuracy");
var resultMistakes = document.getElementById("resultMistakes");
var resultTime     = document.getElementById("resultTime");
var resultBadge    = document.getElementById("resultBadge");
var resultMessage  = document.getElementById("resultMessage");
var bestScoreDisplay = document.getElementById("bestScoreDisplay");
var historyList    = document.getElementById("historyList");
var soundToggle    = document.getElementById("soundToggle");
var navToggle      = document.getElementById("navToggle");
var navLinks       = document.querySelector(".nav-links");

// ============ VARIABLES ============
var selectedTime  = 30;       // Default timer: 30 seconds
var timeLeft      = 30;       // Time remaining
var timerInterval = null;     // Stores the setInterval ID
var isTestRunning = false;    // Is the test currently active?
var currentText   = "";       // The paragraph text to type
var charIndex     = 0;        // Which character the user is on
var mistakes      = 0;        // Total wrong characters typed
var correctChars  = 0;        // Total correct characters typed
var startTime     = null;     // When the test started (timestamp)

// ============ SOUND EFFECTS ============
// We create Audio objects for key press sounds
// Using Web Audio API beep as fallback (no external file needed)
var audioContext = null;

// Function: Play a short beep sound
function playKeySound() {
    // Check if sound is enabled
    if (!soundToggle.checked) return;

    try {
        // Create audio context if not exists
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Create a short beep using oscillator
        var oscillator = audioContext.createOscillator();
        var gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;  // Frequency in Hz
        oscillator.type = "sine";          // Sine wave (smooth sound)

        gainNode.gain.value = 0.05;        // Very low volume

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05); // Play for 50ms
    } catch (e) {
        // If audio fails, just ignore it
    }
}

// Function: Play error sound (lower pitch)
function playErrorSound() {
    if (!soundToggle.checked) return;

    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        var oscillator = audioContext.createOscillator();
        var gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 300;  // Lower frequency for error
        oscillator.type = "sine";

        gainNode.gain.value = 0.06;

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.08);
    } catch (e) {
        // Ignore errors
    }
}

// ============ LOAD A RANDOM PARAGRAPH ============
// This function picks a random paragraph and displays it character by character
function loadParagraph() {
    // Pick a random index from the paragraphs array
    var randomIndex = Math.floor(Math.random() * paragraphs.length);
    currentText = paragraphs[randomIndex];

    // Clear the display area
    textDisplay.innerHTML = "";

    // Loop through each character and create a <span> element for it
    for (var i = 0; i < currentText.length; i++) {
        var span = document.createElement("span");
        span.className = "char";         // Add CSS class
        span.textContent = currentText[i]; // Set the character text
        textDisplay.appendChild(span);    // Add to the display
    }

    // Mark the first character as "current" (shows cursor)
    var allChars = textDisplay.querySelectorAll(".char");
    if (allChars.length > 0) {
        allChars[0].classList.add("current");
    }
}

// ============ START THE TIMER ============
// This function starts counting down from selectedTime
function startTimer() {
    startTime = new Date();  // Record the start time
    isTestRunning = true;

    // setInterval runs a function every 1000ms (1 second)
    timerInterval = setInterval(function () {
        timeLeft = timeLeft - 1;                // Decrease time by 1
        timerDisplay.textContent = timeLeft;     // Update display

        // Update progress bar width (percentage of time passed)
        var timePassed = selectedTime - timeLeft;
        var progressPercent = (timePassed / selectedTime) * 100;
        progressBar.style.width = progressPercent + "%";

        // Update live WPM and CPM
        updateLiveStats();

        // If time runs out, end the test
        if (timeLeft <= 0) {
            endTest();
        }
    }, 1000);
}

// ============ UPDATE LIVE STATS ============
// Calculate and display WPM and CPM while the user is typing
function updateLiveStats() {
    var timePassed = selectedTime - timeLeft;  // Seconds passed
    if (timePassed <= 0) return;               // Avoid division by zero

    var minutes = timePassed / 60;             // Convert to minutes

    // WPM = (correct characters / 5) / minutes  (5 chars = 1 word)
    var wpm = Math.round((correctChars / 5) / minutes);

    // CPM = correct characters / minutes
    var cpm = Math.round(correctChars / minutes);

    liveWpm.textContent = wpm;
    liveCpm.textContent = cpm;
}

// ============ HANDLE USER INPUT ============
// This function runs every time the user types a character
function handleInput() {
    var allChars = textDisplay.querySelectorAll(".char");
    var inputText = typingInput.value;   // What the user has typed
    var inputLength = inputText.length;  // How many characters typed

    // Start timer on first keypress
    if (!isTestRunning && inputLength > 0) {
        startTimer();
    }

    // Reset counters
    mistakes = 0;
    correctChars = 0;

    // Loop through each character and compare with the original text
    for (var i = 0; i < allChars.length; i++) {
        // Remove all classes first
        allChars[i].classList.remove("correct", "wrong", "current");

        if (i < inputLength) {
            // Character has been typed - check if correct or wrong
            if (inputText[i] === currentText[i]) {
                allChars[i].classList.add("correct");  // Green
                correctChars = correctChars + 1;
            } else {
                allChars[i].classList.add("wrong");    // Red
                mistakes = mistakes + 1;
            }
        } else if (i === inputLength) {
            // This is the next character to type - show cursor
            allChars[i].classList.add("current");
        }
        // Characters after current position have no special class
    }

    // Play sound effect
    if (inputLength > 0) {
        var lastTypedChar = inputText[inputLength - 1];
        var expectedChar = currentText[inputLength - 1];
        if (lastTypedChar === expectedChar) {
            playKeySound();
        } else {
            playErrorSound();
        }
    }

    // Update mistakes display
    liveMistakes.textContent = mistakes;

    // Update progress bar based on typing progress
    var typingProgress = (inputLength / currentText.length) * 100;
    progressBar.style.width = typingProgress + "%";

    // If user has typed the entire paragraph, end the test
    if (inputLength >= currentText.length) {
        endTest();
    }
}

// ============ END THE TEST ============
// This function calculates results and displays them
function endTest() {
    // Stop the timer
    clearInterval(timerInterval);
    isTestRunning = false;

    // Disable the input box
    typingInput.disabled = true;

    // Calculate time used
    var endTime = new Date();
    var timeUsed = Math.round((endTime - startTime) / 1000); // in seconds
    var minutes = timeUsed / 60;

    // Avoid division by zero
    if (minutes <= 0) minutes = 0.01;

    // Calculate WPM: (correct characters / 5) / minutes
    var wpm = Math.round((correctChars / 5) / minutes);

    // Calculate CPM: correct characters / minutes
    var cpm = Math.round(correctChars / minutes);

    // Calculate accuracy: (correct / total typed) * 100
    var totalTyped = correctChars + mistakes;
    var accuracy = 0;
    if (totalTyped > 0) {
        accuracy = Math.round((correctChars / totalTyped) * 100);
    }

    // Display results
    resultWpm.textContent = wpm;
    resultCpm.textContent = cpm;
    resultAccuracy.textContent = accuracy + "%";
    resultMistakes.textContent = mistakes;
    resultTime.textContent = timeUsed + "s";

    // Motivational message based on WPM score
    var badge = "";
    var message = "";

    if (wpm < 20) {
        badge = "Beginner";
        message = "Keep practicing! Every expert was once a beginner. You will get better!";
    } else if (wpm < 40) {
        badge = "Good";
        message = "Nice work! You are doing well. Keep it up and your speed will improve!";
    } else if (wpm < 60) {
        badge = "Excellent";
        message = "Impressive speed! You are above average. Keep challenging yourself!";
    } else {
        badge = "Pro Typist";
        message = "Outstanding! You are a typing master. Truly professional speed!";
    }

    resultBadge.textContent = badge;
    resultMessage.textContent = message;

    // Show the result card with animation
    resultCard.style.display = "block";

    // Save best score to localStorage
    saveBestScore(wpm);

    // Save to history
    saveHistory(wpm, cpm, accuracy, mistakes);
}

// ============ SAVE BEST SCORE ============
// localStorage stores data in the browser even after page is closed
function saveBestScore(wpm) {
    // Get the current best score from localStorage
    var bestScore = localStorage.getItem("bestScore");

    // If no best score exists or new score is higher, save it
    if (bestScore === null || wpm > parseInt(bestScore)) {
        localStorage.setItem("bestScore", wpm);
    }

    // Update the display
    loadBestScore();
}

// Function: Load and display best score
function loadBestScore() {
    var bestScore = localStorage.getItem("bestScore");
    if (bestScore !== null) {
        bestScoreDisplay.textContent = bestScore;
    } else {
        bestScoreDisplay.textContent = "0";
    }
}

// ============ SAVE TEST HISTORY ============
// Keep last 5 attempts in localStorage
function saveHistory(wpm, cpm, accuracy, mistakes) {
    // Get existing history or create empty array
    var history = localStorage.getItem("typingHistory");
    if (history !== null) {
        history = JSON.parse(history);  // Convert string to array
    } else {
        history = [];
    }

    // Create a new entry object
    var entry = {
        wpm: wpm,
        cpm: cpm,
        accuracy: accuracy,
        mistakes: mistakes,
        date: new Date().toLocaleDateString()
    };

    // Add new entry at the beginning
    history.unshift(entry);

    // Keep only last 5 entries
    if (history.length > 5) {
        history = history.slice(0, 5);
    }

    // Save back to localStorage
    localStorage.setItem("typingHistory", JSON.stringify(history));

    // Update the display
    loadHistory();
}

// Function: Load and display history
function loadHistory() {
    var history = localStorage.getItem("typingHistory");

    if (history === null || history === "[]") {
        historyList.innerHTML = '<p class="no-history">No attempts yet. Start typing!</p>';
        return;
    }

    history = JSON.parse(history);
    historyList.innerHTML = "";  // Clear existing content

    // Loop through each history entry and create HTML
    for (var i = 0; i < history.length; i++) {
        var item = history[i];
        var div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML =
            "<span>WPM: <strong>" + item.wpm + "</strong></span>" +
            "<span>CPM: <strong>" + item.cpm + "</strong></span>" +
            "<span>Accuracy: <strong>" + item.accuracy + "%</strong></span>" +
            "<span><strong>" + item.date + "</strong></span>";
        historyList.appendChild(div);
    }
}

// ============ RESET / RESTART TEST ============
function resetTest() {
    // Stop timer if running
    clearInterval(timerInterval);

    // Reset all variables
    isTestRunning = false;
    timeLeft = selectedTime;
    charIndex = 0;
    mistakes = 0;
    correctChars = 0;
    startTime = null;

    // Reset displays
    timerDisplay.textContent = selectedTime;
    liveWpm.textContent = "0";
    liveCpm.textContent = "0";
    liveMistakes.textContent = "0";
    progressBar.style.width = "0%";

    // Clear and enable input
    typingInput.value = "";
    typingInput.disabled = false;
    typingInput.focus();

    // Hide result card
    resultCard.style.display = "none";

    // Reload the paragraph characters (re-highlight)
    var allChars = textDisplay.querySelectorAll(".char");
    for (var i = 0; i < allChars.length; i++) {
        allChars[i].classList.remove("correct", "wrong", "current");
    }
    if (allChars.length > 0) {
        allChars[0].classList.add("current");
    }
}

// ============ EVENT LISTENERS ============
// These connect user actions (clicks, typing) to JavaScript functions

// 1. Typing input - runs handleInput on every keystroke
typingInput.addEventListener("input", handleInput);

// 2. Restart button
restartBtn.addEventListener("click", function () {
    resetTest();
});

// 3. New Text button - load a new paragraph and reset
newTextBtn.addEventListener("click", function () {
    loadParagraph();
    resetTest();
});

// 4. Timer option buttons (30s, 60s, 120s)
var timerBtns = document.querySelectorAll(".timer-btn");
for (var i = 0; i < timerBtns.length; i++) {
    timerBtns[i].addEventListener("click", function () {
        // Remove 'active' class from all buttons
        for (var j = 0; j < timerBtns.length; j++) {
            timerBtns[j].classList.remove("active");
        }
        // Add 'active' to clicked button
        this.classList.add("active");

        // Update selected time
        selectedTime = parseInt(this.getAttribute("data-time"));
        timeLeft = selectedTime;
        timerDisplay.textContent = selectedTime;

        // Reset the test
        resetTest();
    });
}

// 5. Mobile hamburger menu toggle
navToggle.addEventListener("click", function () {
    navLinks.classList.toggle("show");
});

// 6. Close mobile menu when a link is clicked
var allNavLinks = document.querySelectorAll(".nav-links a");
for (var i = 0; i < allNavLinks.length; i++) {
    allNavLinks[i].addEventListener("click", function () {
        navLinks.classList.remove("show");

        // Update active link
        for (var j = 0; j < allNavLinks.length; j++) {
            allNavLinks[j].classList.remove("active");
        }
        this.classList.add("active");
    });
}

// 7. Set current year in footer
document.getElementById("currentYear").textContent = new Date().getFullYear();

// ============ INITIALIZE THE APP ============
// These functions run when the page first loads
loadParagraph();    // Load a random paragraph
loadBestScore();    // Load best score from localStorage
loadHistory();      // Load history from localStorage
