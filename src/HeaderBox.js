import React, { Component } from 'react';
import './HeaderBox.css';

class ScoreBox extends Component {
  shouldComponentUpdate (nextProps) {
    return this.props.score !== nextProps.score || this.props.children !== nextProps.children;
  }

  render () {
    let { label, score, children } = this.props;
    return (
      <div className="score-box">
        <div className="score-label">{label}</div>
        <div className="score-content">{score}</div>
        {children}
      </div>
    );
  }
}

export default class HeaderBox extends Component {
  shouldComponentUpdate ({score, bestScore, additionScores}) {
    let props = this.props;
    return props.score !== score ||
      props.bestScore !== bestScore ||
      props.additionScores !== additionScores;
  }

  render () {
    let props = this.props;
    return (
      <div className="header-box">
        <h1 className="title">2048</h1>
        <ScoreBox score={props.score} label="SKOR">
        {
          props.additionScores.map((score, i) =>
            <div className="addition-score" key={score.key}
              onAnimationEnd={(e) => props.onAdditionScoreAnimationEnd(e, score, i)}
            >+{score.score}</div>
          )
        }
        </ScoreBox>
        <ScoreBox score={props.bestScore} label="BEST SKOR" />
        <div className="desc-txt">
          <br/>
          Ok tuşlarını kullanarak <span className="bold">2048 elde et.</span>
        </div>
        <button className="new-game-btn" onClick={props.onNewGame}>Yeni Oyun</button>
      </div>
    );
  }
}
