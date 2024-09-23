import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { DICE } from "./constants";

const defaultGameSeconds = 244; // 4 minutes and 4 seconds
const formatTime = (timeInSeconds) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};


function App() {
  const [board, setBoard] = useState([]);
  const [dice, setDice] = useState(DICE);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [diceInput, setDiceInput] = useState([]);
  const [hideLetters, setHideLetters] = useState(false);
  const [time, setTime] = useState(defaultGameSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [gameLength, setGameLength] = useState(formatTime(defaultGameSeconds)); // Actual game length applied to the timer
  const [gameLengthInput, setGameLengthInput] = useState(
    formatTime(defaultGameSeconds)
  ); // Input field state for game length

  const timerRef = useRef(null);

  useEffect(() => {
    generateBoard();
  }, [dice]);

  useEffect(() => {
    if (time <= 0 && isTimerRunning) {
      setHideLetters(true); // Auto-hide letters when time is up
      stopTimer();
    }
  }, [time, isTimerRunning]);

  const generateBoard = () => {
    const shuffledDice = [...dice].sort(() => 0.5 - Math.random());
    const newBoard = shuffledDice.map((die) => ({
      active: die[Math.floor(Math.random() * die.length)],
      die: die,
    }));
    setBoard(newBoard);
    setSelectedIndex(null);
  };

  const shuffleDie = (index) => {
    const newBoard = [...board];
    const die = newBoard[index].die;
    const newActive = die[Math.floor(Math.random() * die.length)];
    newBoard[index].active = newActive;
    setBoard(newBoard);
  };

  const handleClick = (index) => {
    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else {
      const newBoard = [...board];
      const temp = newBoard[selectedIndex];
      newBoard[selectedIndex] = newBoard[index];
      newBoard[index] = temp;
      setBoard(newBoard);
      setSelectedIndex(null);
    }
  };

  const handleEditClick = () => {
    setDiceInput(dice.map((die) => die.join(",")));
    setGameLengthInput(gameLength); // Ensure modal shows the current game length
    setShowModal(true);
  };

  const handleInputChange = (index, value) => {
    const newDiceInput = [...diceInput];
    newDiceInput[index] = value;
    setDiceInput(newDiceInput);
  };

  const handleGameLengthInputChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^0-9:]/g, ""); // Remove anything that's not a number or :
    setGameLengthInput(sanitizedValue); // Update the input field, but don't apply changes yet
  };

  const timerIsValid = (timeString) => /^\d+:\d{2}$/.test(timeString);
  const handleUpdate = () => {
    // Validate game length format before applying
    if (timerIsValid(gameLengthInput)) {
      setGameLength(gameLengthInput);
      const [minutes, seconds] = gameLengthInput.split(":").map(Number);
      setTime(minutes * 60 + seconds); // Update the timer's total time
    }
    const updatedDice = diceInput.map((dieString) => dieString.split(","));
    if (JSON.stringify(updatedDice) !== JSON.stringify(dice)) {
      setDice(updatedDice);
    }
    setShowModal(false);
  };

  const toggleHideLetters = () => {
    setHideLetters(!hideLetters);
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      clearInterval(timerRef.current);
    } else {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    const [minutes, seconds] = gameLength.split(":").map(Number);
    setTime(minutes * 60 + seconds); // Reset to the current game length
    setIsTimerRunning(false);
    clearInterval(timerRef.current);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    setIsTimerRunning(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <div className="App">
      <div className="timer">
        <h3>{formatTime(time)}</h3>
        <button onClick={toggleTimer}>
          {isTimerRunning ? "Pause" : "Start"}
        </button>
        <button onClick={resetTimer}>Reset</button>
      </div>
      <div className="board">
        {board.map((cell, index) => (
          <div
            key={index}
            className={`cell ${selectedIndex === index ? "selected" : ""}`}
            onDoubleClick={() => shuffleDie(index)}
            onClick={() => handleClick(index)}
          >
            {!hideLetters && cell.active}
          </div>
        ))}
      </div>
      <button onClick={generateBoard}>Shuffle</button>
      <button onClick={handleEditClick}>Edit</button>
      <button onClick={toggleHideLetters}>
        {hideLetters ? "Show" : "Hide"}
      </button>

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
              {diceInput.map((die, index) => (
                <textarea
                  key={index}
                  value={die}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                />
              ))}
            </div>
            <button onClick={handleUpdate}>Update</button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
