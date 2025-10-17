import React, { useState, useRef, useEffect } from "react";
import "./App.css";

export default function App() {
  const DEFAULT_MINUTES = 25;
  const DEFAULT_SECONDS = DEFAULT_MINUTES * 60;

  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_SECONDS);
  const [running, setRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [todayTotalMinutes, setTodayTotalMinutes] = useState(0);

  // refs
  const intervalRef = useRef(null);
  const startTsRef = useRef(null);
  const baseRemainingRef = useRef(DEFAULT_SECONDS);
  const completedRef = useRef(false);

  const treeLevel = Math.min(sessionsCompleted, 6);

  // start interval (idempotent)
  function startInterval() {
    if (intervalRef.current) return;

    startTsRef.current = Date.now();
    baseRemainingRef.current = remainingSeconds;
    completedRef.current = false;

    intervalRef.current = setInterval(() => {
      // 1) 빠르게 이미 완료된 상태면 아무 일도 하지 말고 리턴
      if (completedRef.current) return;

      // 2) 경과시간 계산 (절대시간 기준)
      const elapsedSec = Math.floor((Date.now() - startTsRef.current) / 1000);
      const newRem = Math.max(0, baseRemainingRef.current - elapsedSec);

      // 3) 완료 도달 처리: 가장 먼저 동기적으로 completedRef를 찍고 인터벌을 정리
      if (newRem === 0) {
        if (!completedRef.current) {
          completedRef.current = true;           // **동기적으로 보호**
          const ir = intervalRef.current;
          if (ir) {
            clearInterval(ir);                  // 인터벌 즉시 정리
            intervalRef.current = null;
          }
          // 상태 업데이트는 그 다음
          setRemainingSeconds(0);
          setRunning(false);
          setSessionsCompleted((c) => c + 1);
          setTodayTotalMinutes((t) => t + DEFAULT_MINUTES);
        }
        return;
      }

      // 4) 일반 업데이트: 불필요한 setState 방지를 위해 값이 다를 때만 업데이트
      setRemainingSeconds((prev) => (prev === newRem ? prev : newRem));
    }, 250); // 250ms 체크 (정확도와 반응성 균형)
  }

  function stopInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // 일시정지시 다시 기준 남은 시간 갱신
    baseRemainingRef.current = remainingSeconds;
  }

  function toggleRunning() {
    if (running) {
      stopInterval();
      setRunning(false);
    } else {
      if (remainingSeconds === 0) {
        setRemainingSeconds(DEFAULT_SECONDS);
        baseRemainingRef.current = DEFAULT_SECONDS;
      }
      startInterval();
      setRunning(true);
    }
  }

  function resetTimer() {
    stopInterval();
    setRunning(false);
    setRemainingSeconds(DEFAULT_SECONDS);
    baseRemainingRef.current = DEFAULT_SECONDS;
    completedRef.current = false;
  }

  function setDemoShort() {
    stopInterval();
    setRunning(false);
    setRemainingSeconds(10);
    baseRemainingRef.current = 10;
    completedRef.current = false;
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div className="focusly-root">
      <header className="hero">
        <div className="logo">FOCUSLY</div>
        <h1 className="slogan">내 안의 몰입을 깨우는 시간, FOCUSLY</h1>
        <p className="sub">폰을 잠그고, 습관을 만들고, 몰입을 기르세요.</p>
      </header>

      <main className="container">
        <section className="left">
          <h2>혹시 이런 경험 있으셨나요?</h2>
          <ul className="problems">
            <li><strong>집중 습관 부족</strong><br />시작은 쉬워도 지속이 어렵고, 계획이 자꾸 미뤄집니다.</li>
            <li><strong>과도한 스트레스</strong><br />머리가 복잡하면 책상 앞에 있어도 손이 움직이지 않죠.</li>
            <li><strong>외부 자극</strong><br />알림 한 번에 집중이 깨지고 시간이 사라집니다.</li>
          </ul>

          <div className="how">
            <h3>FOCUSLY가 도와줍니다</h3>
            <ol>
              <li>폰 잠금과 방해 차단으로 몰입 환경을 만듭니다.</li>
              <li>타이머와 루틴으로 습관을 만들어갑니다.</li>
              <li>세션 완료 시 나무 보상으로 동기를 부여합니다.</li>
            </ol>
          </div>
        </section>

        <section className="center">
          <div className="timer-card">
            <div className="today">
              <div>오늘 총 몰입</div>
              <div className="today-number">{todayTotalMinutes}분</div>
            </div>

            <div className="timer-display">{formatTime(remainingSeconds)}</div>

            <div className="controls">
              <button className={`btn ${running ? "ghost" : "primary"}`} onClick={toggleRunning}>
                {running ? "일시정지" : "Start Focus"}
              </button>
              <button className="btn" onClick={resetTimer}>리셋</button>
              <button className="btn small" onClick={() => alert("폰 잠금(시뮬레이션): 실제 OS 차단은 불가합니다.")}>🔒 폰 잠금</button>
            </div>

            <div className="demo-row">
              <button className="btn outline" onClick={setDemoShort}>데모 10초</button>
              <div className="status">세션 완료: {sessionsCompleted}</div>
            </div>

            <div className="progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min((sessionsCompleted / 6) * 100, 100)}%` }} />
              </div>
              <div className="progress-label">몰입 성장: 레벨 {treeLevel} / 6</div>
            </div>
          </div>
        </section>

        <section className="right">
          <div className="reward-card">
            <h3>보상 공간</h3>
            <p>세션을 완료할 때마다 나무가 자랍니다.</p>

            <div className="tree-viewport" aria-hidden>
              <div className={`tree level-${treeLevel}`}>
                <div className="trunk" />
                <div className="leaf leaf-1" />
                <div className="leaf leaf-2" />
                <div className="leaf leaf-3" />
                <div className="leaf leaf-4" />
                <div className="leaf leaf-5" />
              </div>
            </div>

            <div className="cta">
              <p>정해진 시간 동안 방해를 차단하고 집중하세요.</p>
              <button className="btn primary">지금 시작해보기</button>
            </div>
          </div>

          <div className="tips">
            <h4>간단 팁</h4>
            <ul>
              <li>작은 목표(25분)를 먼저 세우세요.</li>
              <li>휴식은 5~10분, 규칙적으로 쉬세요.</li>
              <li>시작할 때는 알림을 모두 끄세요.</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="footer">
        <small>FOCUSLY — 공부를 위한 몰입 앱</small>
      </footer>
    </div>
  );
}
