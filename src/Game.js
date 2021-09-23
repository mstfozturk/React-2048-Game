import React, { Component } from "react";
import GameBoard from "./GameBoard";
import GameOver from "./GameOver";
import Promise from "promise";
import Swipe from "react-easy-swipe";

const MOVE_DIR = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

let tileUUID = 0;

export default class Game extends Component {
  constructor(props) {
    super(props);
    this.state = this.getInitialState();
  }

  componentDidMount() {
    this.newTile();
    this.newTile();
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleSwipeRight = this.handleSwipeRight.bind(this);
    this.handleSwipeLeft = this.handleSwipeLeft.bind(this);
    this.handleSwipeDown = this.handleSwipeDown.bind(this);
    this.handleSwipeUp = this.handleSwipeUp.bind(this);
    window.addEventListener("keydown", this.handleKeyPress);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyPress);
  }

  handleKeyPress(ev) {
    let { key } = ev;

    if (!this.state.gameStarted) return;
    let match = key.toLowerCase().match(/arrow(up|right|down|left)/);
    if (match) {
      this.move(match[1]);
      ev.preventDefault();
    }
  }

  handleSwipeRight() {
    if (!this.state.gameStarted) return;
    this.move("right");
  }
  handleSwipeLeft() {
    if (!this.state.gameStarted) return;
    this.move("left");
  }
  handleSwipeDown() {
    if (!this.state.gameStarted) return;
    this.move("down");
  }
  handleSwipeUp() {
    if (!this.state.gameStarted) return;
    this.move("up");
  }
  

  getInitialState() {
    let size = 4;
    let cells = [];
    for (let i = 0; i < size; i++) {
      let row = (cells[i] = []);
      for (let j = 0; j < size; j++) {
        row[j] = null;
      }
    }
    return {
      size,
      cells,
      gameStarted: true,
      additionScores: [],
      score: 0,
      bestScore: +localStorage.getItem("bestScore"),
    };
  }

  eachCell(state, fn) {
    return state.cells.forEach((row, i) =>
      row.forEach((cell, j) => fn(cell, i, j))
    );
  }

  newTile() {
    this.setState((state) => {
      let cells = this.state.cells;
      let emptyCells = [];
      // boşları getir ve merge edilecekleri et
      this.eachCell(state, (cell, i, j) => {
        if (!cell) {
          emptyCells.push([i, j]);
        } else if (cell.mergedItem) {
          // merge et
          cell.number += cell.mergedItem.number;
          cell.newMerged = true; // merge edilenler için işaret
        }
      });
      if (emptyCells.length) {
        let index = Math.floor(Math.random() * emptyCells.length);
        let [row, cell] = emptyCells[index];
        cells[row][cell] = {
          number: Math.random() > 0.8 ? 4 : 2,
          newGenerated: true,
          newMerged: false,
          mergedItem: null,
          uuid: tileUUID++,
        };
      }
      return { cells };
    });
  }

  isMovable() {
    let movable = false;
    let cells = this.state.cells;
    let size = this.state.size;
    // hücreleri kontrol et
    // boş hücre varsa moveable
    // aynı numaralı hücreler movable
    this.eachCell(this.state, (cell, i, j) => {
      if (movable) return; // break;
      if (!cell) {
        movable = true;
        return;
      }
      if (i < size - 1) {
        let bottomCell = cells[i + 1][j];
        if (bottomCell && bottomCell.number === cell.number) {
          movable = true;
          return;
        }
      }
      if (j < size - 1) {
        let rightCell = cells[i][j + 1];
        if (rightCell && rightCell.number === cell.number) {
          movable = true;
          return;
        }
      }
    });

    return movable;
  }

  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  move(dir) {
    if (this.isMoving) return;
    let size = this.state.size;
    let cells = this.state.cells;
    let dirOffset = MOVE_DIR[dir];
    let hasMovingTile = false;
    let score = 0;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        let row = i,
          col = j;
        if (dir === "right") {
          // sağdan sola tekrarı için reverse et
          col = size - j - 1;
        }
        if (dir === "down") {
          // aşağıdan yukarı için reverse
          row = size - i - 1;
        }

        //yöne göre i j yi satır sütüna eşle
        let cell = cells[row][col];
        if (!cell) continue; // hücre boşsa devam et

        // tagları sıfırla
        cell.newGenerated = false;
        cell.newMerged = false;
        cell.mergedItem = null;

        // yöne göre sonraki hücreyi bul
        // sonraki koord al
        let nextCol = col + dirOffset[0];
        let nextRow = row + dirOffset[1];
        let nextCell;

        // oyun alanı dışına çıkma
        while (
          nextCol >= 0 &&
          nextCol < size &&
          nextRow >= 0 &&
          nextRow < size
        ) {
          nextCell = cells[nextRow][nextCol];
          if (nextCell) {
            // gidilen yönde dolu hicre varsa çık
            break;
          }
          //sonraki hücre boşsa devam et
          nextCol += dirOffset[0];
          nextRow += dirOffset[1];
        }

        if (
          nextCell &&
          !nextCell.mergedItem &&
          nextCell.number === cell.number
        ) {
          // başka hücreyle birleşmemiş aynı sayılı hücreyi al
          cell.mergedItem = nextCell;
          cells[nextRow][nextCol] = cell;
          cells[row][col] = null;
          hasMovingTile = true;
          score += nextCell.number + cell.number; // skor hesabı
        } else {
          // farklı sayılı ya da yeni merge edilen hücre varsa yanına yerleş
          nextCol -= dirOffset[0];
          nextRow -= dirOffset[1];

          if (nextCol !== col || nextRow !== row) {
            cells[nextRow][nextCol] = cell;
            cells[row][col] = null;
            hasMovingTile = true;
          }
        }
      }
    }

    if (hasMovingTile) {
      this.isMoving = true;

      this.setState((state) => {
        let nextState = {
          cells,
          score: state.score + score,
        };
        if (score) {
          nextState.additionScores = [
            ...state.additionScores,
            { score, key: Date.now() },
          ];
        }
        return nextState;
      });

      // yeni sayı için beklet
      this.sleep(100).then(() => {
        this.newTile();
        this.checkGameStatus();
        this.isMoving = false;
      });
    }
  }

  checkGameStatus() {
    let movable = this.isMovable();
    if (!movable) {
      //oyun bitti kontrolü
      let bestScore = this.state.bestScore;
      if (bestScore < this.state.score) {
        bestScore = this.state.score;
        localStorage.setItem("bestScore", bestScore);
      }
      this.setState({ gameStarted: false, bestScore });
    }
  }

  render() {
    return (
      <Swipe
        allowMouseEvents={true}
        onSwipeRight={this.handleSwipeRight}
        onSwipeLeft={this.handleSwipeLeft}
        onSwipeUp={this.handleSwipeUp}
        onSwipeDown={this.handleSwipeDown}
        tolerance={15}
      >
        <GameBoard
          {...this.state}
          onAdditionScoreAnimationEnd={this.handleAdditionScoreAnimationEnd.bind(
            this
          )}
          onNewGame={this.startNewGame.bind(this)}
        >
          {!this.state.gameStarted && (
            <GameOver onNewGame={this.startNewGame.bind(this)}></GameOver>
          )}
        </GameBoard>
      </Swipe>
    );
  }

  handleAdditionScoreAnimationEnd(ev, scoreItem, index) {
    this.setState((state) => {
      let additionScores = state.additionScores;
      //skorun üstüne eklememek için animasyondan sonra arrayi boşalttım
      return { additionScores: [...additionScores.slice(index + 1)] };
    });
  }

  startNewGame() {
    setTimeout(() => {
      tileUUID = 0;
      this.setState(this.getInitialState());
      this.newTile();
      this.newTile();
    }, 0);
  }
}
