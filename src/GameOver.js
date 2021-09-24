import React from "react";
import "./GameOver.css";

export default function GameOver({ onNewGame }) {
  return (
    <div className="game-over">
      <h1 className="title">!&#161; OYUN BİTTİ &#161;!</h1>
      <button onClick={onNewGame}>Tekrar Dene</button>
    </div>
  );
}
