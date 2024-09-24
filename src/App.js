import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { DICE } from "./constants";
import { Trie } from "./Trie";

let wordsArray = null;
const defaultGameSeconds = 244; // 4 minutes and 4 seconds
const rowLength = 5;
const coordToIndex = ([row, col]) => row * rowLength + col;

const randomLetter = (letters) =>
  letters[Math.floor(Math.random() * letters.length)];

const timeStringFromSeconds = (timeInSeconds) => {
  const roundedTime = Math.round(timeInSeconds);
  const minutes = Math.floor(roundedTime / 60);
  const seconds = roundedTime % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

const secondsFromTimeString = (timeString) => {
  const [minutes, seconds] = timeString.split(":").map(Number);
  return minutes * 60 + seconds;
};

function App() {
  const [board, setBoard] = useState([]);
  const [dice, setDice] = useState(DICE);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showWords, setShowWords] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [diceInput, setDiceInput] = useState([]);
  const [hideLetters, setHideLetters] = useState(false);
  const [time, setTime] = useState(defaultGameSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [gameLength, setGameLength] = useState(
    timeStringFromSeconds(defaultGameSeconds)
  );
  const [gameLengthInput, setGameLengthInput] = useState(
    timeStringFromSeconds(defaultGameSeconds)
  );
  const [wordsFound, setWordsFound] = useState([]);
  const [hoveredWordPath, setHoveredWordPath] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    generateBoard();
  }, []);

  useEffect(() => {
    if (time <= 0 && isTimerRunning) {
      setHideLetters(true); // Auto-hide letters when time is up
      setTime(0);
      stopTimer();
    }
  }, [time, isTimerRunning]);

  const generateBoard = () => {
    // const shuffledDice = [...dice].sort(() => 0.5 - Math.random());
    const shuffledDice = [...dice]
      .map((letters, dieIndex) => ({ letters, dieIndex }))
      .sort(() => 0.5 - Math.random());
    console.log({ shuffledDice, shuffledDice });
    const newBoard = shuffledDice.map(({ letters, dieIndex }) => ({
      activeLetter: randomLetter(letters),
      letters,
      dieIndex
    }));
    setBoard(newBoard);
    solveBoard(newBoard);
    setSelectedIndex(null);
  };

  const shuffleDie = (index) => {
    if (isTimerRunning) return;
    const newBoard = [...board];
    const { letters, activeLetter: oldActive } = newBoard[index];
    // there's only one value, don't get stuck in a loop
    if (new Set(letters).size === 1) return;

    let newActive = oldActive;
    while (newActive === oldActive) {
      newActive = randomLetter(letters);
    }
    newBoard[index].activeLetter = newActive;
    setBoard(newBoard);
    solveBoard(newBoard);
  };

  const handleDieClick = (index) => {
    if (isTimerRunning) return;
    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else {
      if (selectedIndex === index) {
        setSelectedIndex(null);
        return;
      }
      const newBoard = [...board];
      const temp = newBoard[selectedIndex];
      newBoard[selectedIndex] = newBoard[index];
      newBoard[index] = temp;
      setBoard(newBoard);
      solveBoard(newBoard);
      setSelectedIndex(null);
    }
  };

  const openOptions = () => {
    const sortedDice = [];
    board.forEach(
      ({ letters, dieIndex }, boardIdx) =>
        (sortedDice[boardIdx] = {
          letters: letters.join(","),
          newLetters: letters.join(","),
          dieIndex
        })
    );
    setDiceInput(sortedDice);
    setGameLengthInput(gameLength); // Ensure modal shows the current game length
    setShowModal(true);
  };

  const updateDiceInput = (index, value) => {
    const newDiceInput = [...diceInput];
    const cleanedValue = value.replace(/[^a-z,]/gi, ""); // Remove anything that's not a letter or comma
    newDiceInput[index].newLetters = cleanedValue;
    setDiceInput(newDiceInput);
  };

  const handleGameLengthInputChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^0-9:]/g, ""); // Remove anything that's not a number or :
    setGameLengthInput(sanitizedValue); // Update the input field, but don't apply changes yet
  };

  const timerIsValid = (timeString) => /^\d+:\d{2}$/.test(timeString);
  const saveOptions = () => {
    // Validate game length format before applying
    if (timerIsValid(gameLengthInput)) {
      setGameLength(gameLengthInput);
      setTime(secondsFromTimeString(gameLengthInput));
    }

    let updateMade = false;
    const updatedDice = [...dice];
    const updatedBoard = [...board];
    diceInput.forEach((die, boardIdx) => {
      if (die.newLetters !== die.letters) {
        const newLetters = die.newLetters.split(",");
        updatedDice[die.dieIndex] = newLetters;

        updatedBoard[boardIdx].letters = newLetters;
        updatedBoard[boardIdx].activeLetter = randomLetter(newLetters);
        updateMade = true;
      }
    });

    if (updateMade) {
      setDice(updatedDice);
      setBoard(updatedBoard);
      solveBoard(updatedBoard);
    }
    setShowModal(false);
  };

  const cancelOptions = () => {
    setShowModal(false);
  };

  const toggleHideLetters = () => {
    setHideLetters(!hideLetters);
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      clearTimeout(timerRef.current);
    } else {
      if (time <= 0) {
        setTime(secondsFromTimeString(gameLength));
      }
      const interval = 1000; // ms
      let startTime = Date.now(); // Time when the timer started
      let expectedTime = startTime + interval; // Expected time for the next step

      const step = () => {
        const now = Date.now();
        // Time since the last cycle
        const actualElapsed = now - startTime;
        startTime = now;

        // Decrement by actual elapsed seconds
        setTime((prevTime) => prevTime - actualElapsed / 1000);

        expectedTime += interval;
        const timeUntilNextStep = expectedTime - Date.now();

        timerRef.current = setTimeout(step, Math.max(0, timeUntilNextStep));
      };

      // Start the timer
      timerRef.current = setTimeout(step, interval);
    }
    setIsTimerRunning(!isTimerRunning); // Toggle timer state
  };

  const resetTimer = () => {
    // Reset to the current game length
    setTime(secondsFromTimeString(gameLength));
    setIsTimerRunning(false);
    clearTimeout(timerRef.current);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    setIsTimerRunning(false);
  };

  const solveBoard = async (board) => {
    if (!wordsArray) {
      const response = await fetch(`${process.env.PUBLIC_URL}/long_words.csv`);
      const text = await response.text();
      // Split CSV by newlines and trim whitespace
      wordsArray = text.split("\n").map((word) => word.trim());
    }

    const trie = new Trie();
    wordsArray.forEach((word) => trie.insert(word));

    const foundWords = [];
    const visited = Array(5)
      .fill(null)
      .map(() => Array(5).fill(false));

    const isInBounds = (row, col) => row >= 0 && row < 5 && col >= 0 && col < 5;

    const searchWord = (row, col, node, path, word) => {
      if (!isInBounds(row, col) || visited[row][col] || !node.startsWith(word))
        return;

      visited[row][col] = true;
      path.push([row, col]);
      word += board[row * 5 + col].activeLetter.toLowerCase();

      if (node.search(word)) {
        const existingWord = foundWords.find((w) => w.word === word);
        if (existingWord) {
          existingWord.count++;
        } else {
          foundWords.push({ word, path: [...path], count: 1 });
        }
      }

      const directions = [
        // Horizontal and vertical
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
        // Diagonal
        [1, -1],
        [1, 1],
        [-1, -1],
        [-1, 1]
      ];

      for (let [dx, dy] of directions) {
        searchWord(row + dx, col + dy, node, path, word);
      }

      path.pop();
      visited[row][col] = false;
    };

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        searchWord(row, col, trie, [], "");
      }
    }

    setWordsFound(
      foundWords.sort(
        (a, b) => b.word.length - a.word.length || a.word.localeCompare(b.word)
      )
    );
  };

  const drawWordPath = (path) => {
    setHoveredWordPath(path);

    const boardElement = document.querySelector(".board");
    const canvas = document.getElementById("hoverCanvas");
    const ctx = canvas.getContext("2d");

    // Get the actual dimensions and position of the game board
    const boardRect = boardElement.getBoundingClientRect();
    const cellWidth = boardRect.width / 5; // Assuming 5x5 board
    const cellHeight = boardRect.height / 5;

    // Set the canvas to match the board's size
    canvas.width = boardRect.width;
    canvas.height = boardRect.height;

    // canvas.style.top = `${boardRect.top}px`;
    canvas.style.top = 0;
    // canvas.style.left = `${boardRect.left}px`;
    canvas.style.left = "20px";

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings
    ctx.strokeStyle = "#ffd618";
    ctx.lineWidth = 8;

    // Draw lines connecting the dice
    ctx.beginPath();
    for (let i = 0; i < path.length; i++) {
      const [row, col] = path[i];
      const centerX = col * cellWidth + cellWidth / 2;
      const centerY = row * cellHeight + cellHeight / 2;
      ctx.lineTo(centerX, centerY);
    }
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = document.getElementById("hoverCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear any existing drawings
    setHoveredWordPath(null);
  };

  const getCellClasses = (index) => {
    let classes = "cell ";
    if (selectedIndex === index) classes += "selected ";
    if (hoveredWordPath?.some((coord) => coordToIndex(coord) === index)) {
      classes += "hovered ";
      if (coordToIndex(hoveredWordPath[0]) === index) {
        classes += "first ";
      }
      if (coordToIndex(hoveredWordPath[hoveredWordPath.length - 1]) === index) {
        classes += "last ";
      }
    }
    return classes;
  };

  const getCellStyle = (index) => {
    if (!showHeatmap) return {};

    const cellUsage = wordsFound.reduce((acc, { path }) => {
      path.forEach(([row, col]) => {
        const cellIndex = coordToIndex([row, col]);
        acc[cellIndex] = (acc[cellIndex] || 0) + 1;
      });
      return acc;
    }, {});

    const maxUsage = Math.max(...Object.values(cellUsage), 0);
    const usage = cellUsage[index] || 0;
    const opacity = maxUsage ? usage / maxUsage : 0;

    return {
      backgroundColor: !!opacity ? `rgba(255, 214, 24, ${opacity})` : "#f0f0f0"
    };
  };

  return (
    <div className={`App ${isTimerRunning ? " playing" : ""}`}>
      <div className="wrapper">
        <div className="timer">
          <h3>{timeStringFromSeconds(time)}</h3>
          <button onClick={toggleTimer}>
            {isTimerRunning ? "Pause" : "Start"}
          </button>
          <button onClick={resetTimer}>Reset</button>
        </div>
        {/* Board and Canvas */}
        <div className="board-container">
          <div
            className={`board ${!!hoveredWordPath ? "solution-hovered" : ""}`}
          >
            {board.map((cell, index) => (
              <div
                key={index}
                className={getCellClasses(index)}
                style={getCellStyle(index)}
                onDoubleClick={() => shuffleDie(index)}
                onClick={() => handleDieClick(index)}
              >
                {!hideLetters && cell.activeLetter}
              </div>
            ))}
          </div>
          <canvas
            id="hoverCanvas"
            style={{
              position: "absolute",
              pointerEvents: "none"
            }}
          />
        </div>
        {!isTimerRunning && (
          <>
            <button onClick={generateBoard}>Shuffle</button>
            <button onClick={openOptions}>Edit</button>
            <button onClick={toggleHideLetters}>
              {hideLetters ? "Show" : "Hide"}
            </button>

            <div className="solutions">
              <div className="toggles">
                <span>Show:</span>
                <label>
                  <input
                    type="checkbox"
                    checked={showHeatmap}
                    onChange={() => setShowHeatmap(!showHeatmap)}
                  />
                  Heatmap
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={showStats}
                    onChange={() => setShowStats(!showStats)}
                  />
                  Stats
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={showWords}
                    onChange={() => setShowWords(!showWords)}
                  />
                  Words
                </label>
              </div>
              {showWords && (
                <div className="word-list">
                  {wordsFound.map(({ path, word, count }, index) => (
                    <span key={index}>
                      {/* new line when we get to the next group of words by length */}
                      {!!index &&
                      word.length < wordsFound[index - 1].word.length ? (
                        <br />
                      ) : null}
                      <p
                        onMouseEnter={() => drawWordPath(path)}
                        onMouseLeave={() => clearCanvas()}
                      >
                        {word}{" "}
                        {count > 1 ? (
                          <i>({count})</i>
                        ) : (
                          // hack to allow selection of individual words (otherwise multiple selected)
                          <i style={{ position: "absolute" }}>&nbsp;</i>
                        )}
                      </p>
                    </span>
                  ))}
                </div>
              )}
              {showStats && (
                <div className="stats">
                  <br />
                  {!wordsFound.length
                    ? "None"
                    : Object.entries(
                        wordsFound.reduce((acc, { word }) => {
                          const length = word.length;
                          acc[length] = (acc[length] || 0) + 1;
                          return acc;
                        }, {})
                      )
                        .sort((a, b) => b[0] - a[0])
                        .map(([length, count]) => (
                          <div key={length}>
                            {length} letters: <b>{count}</b>
                          </div>
                        ))}
                </div>
              )}
            </div>
          </>
        )}
        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>Edit</h2>
              <label>
                Game Length (mm:ss):{" "}
                <input
                  type="text"
                  value={gameLengthInput}
                  className={timerIsValid(gameLengthInput) ? "" : "invalid"}
                  onChange={handleGameLengthInputChange}
                  maxLength={5}
                />
              </label>
              <br />
              <br />
              <div className="textarea-grid">
                {diceInput.map(({ letters, newLetters }, index) => (
                  <textarea
                    key={index}
                    value={newLetters}
                    onChange={(e) => updateDiceInput(index, e.target.value)}
                  />
                ))}
              </div>
              <button onClick={saveOptions}>Update</button>
              <button onClick={cancelOptions}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
