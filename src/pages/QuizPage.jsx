import { useEffect, useState } from 'react';
import axios from 'axios';
import { Header } from '../components/Header';
import styles from '../styles/pages/QuizPage.module.scss';
import CameraCapture from '../components/CameraCapture';
import { EyesLayout } from '../components/EyesLayout';
import { Link, useNavigate } from "react-router-dom";
import {
  quizearlyend,
  quiz_end,
  correct,
  uncorrect,
  quizbackground,
  quiz_bad,
  quiz_great,
  quiz_okay,
  quiz,
  quiz_game,
  ready,
  id11,
  id12,
  id13,
  id14,
  id15,
  modalnextIcon,
} from '../assets';
import { usePostStore } from "../store/usePostStore";

const TOTAL_TIME = 30 * 1000;

export const QuizPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledChoices, setShuffledChoices] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [isResultShown, setIsResultShown] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [allow, setAllow] = useState(false);
  const [quizStart, setQuizStart] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('ready');
  const [endedEarly, setEndedEarly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { age } = usePostStore(); // 전역 데이터 꺼내기
  const navigate = useNavigate();

  useEffect(() => {
    // 나이, 시력, 태그가 없으면 홈으로 이동
    if (!age) {
      navigate("/test");
    }

    const getData = async () => {
      try {
        const response = await axios.get(`/api/quiz`);
        const data = response.data;
        if (!data?.data?.all) throw new Error('퀴즈 데이터 없음');

        const imageMap = { 11: id11, 12: id12, 13: id13, 14: id14, 15: id15 };
        const formattedQuizzes = data.data.all.map((quizItem) => {
          const id = Number(quizItem.id);
          const question = quizItem.Question;
          const choices = quizItem.AnswerSet.map((a) => a.content);
          const answer =
            quizItem.AnswerSet.find((a) => a.isCorrect === 1)?.content || '';
          const image = imageMap[id];
          return { id, question, choices, answer, image };
        });

        const selected = formattedQuizzes
          .sort(() => Math.random() - 0.5)
          .slice(0, 15);
        setQuizzes(selected);
        setShuffledChoices(shuffleArray(selected[0].choices));
      } catch (error) {
        console.error('퀴즈 데이터를 가져오는데 실패함:', error);
      }
    };
    getData();
  }, []);

  useEffect(() => {
    let timer;
    if (quizStart && !isQuizFinished && !isResultShown) {
      timer = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;
        setElapsedTime(elapsed);
        if (elapsed >= TOTAL_TIME) {
          clearInterval(timer);
          setIsQuizFinished(true);
          setShowResult(false);
          setTimeout(() => setIsResultShown(true), 500);
        }
      }, 100);
    }
    return () => clearInterval(timer);
  }, [quizStart, startTime, isResultShown, isQuizFinished]);

  const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

  const handleChoiceClick = (choice) => {
    if (showResult || isQuizFinished) return;
    setSelectedChoice(choice);

    // 정답 확인 및 상태 업데이트
    if (choice === currentQuiz.answer) {
      setIsCorrect(true);
      setCorrectCount((prevCount) => prevCount + 1);
    } else {
      setIsCorrect(false);
    }

    // 0.8초 뒤에 결과 모달을 표시하도록 지연 추가
    setTimeout(() => {
      setShowResult(true); // 모달 표시
    }, 800); // 0.8초 지연
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;

    if (nextIndex < quizzes.length) {
      setCurrentIndex(nextIndex);
      setShuffledChoices(shuffleArray(quizzes[nextIndex].choices));
      setSelectedChoice(null);
      setShowResult(false);
    } else {
      setShowResult(false);
      setIsQuizFinished(true);

      const now = Date.now();
      const usedTime = now - startTime;
      const remainingTime = Math.max(TOTAL_TIME - usedTime, 0);

      setEndedEarly(remainingTime > 0);
      setTimeout(() => setIsResultShown(true), remainingTime);
    }
  };

  const handleStartQuiz = () => {
    setStartTime(Date.now());
    setQuizStart(true);
  };

  if (quizzes.length === 0)
    return <div className={styles.loading}>로딩 중...</div>;

  const currentQuiz = quizzes[currentIndex];
  const progress = Math.min((elapsedTime / TOTAL_TIME) * 100, 100);
  const timeLabel = `${String(Math.floor(elapsedTime / 1000 / 60)).padStart(
    2,
    '0'
  )}:${String(Math.floor((elapsedTime / 1000) % 60)).padStart(2, '0')}`;

  return (
    <>
      <CameraCapture
        allow={allow}
        setAllow={setAllow}
        quizStart={quizStart}
        setQuizStart={setQuizStart}
        setCameraStatus={setCameraStatus}
      />

      {!quizStart && cameraStatus !== 'granted' && (
        <div className={styles.permissionWrapper}>
          <div className={styles.headerWrapper}>
            <Header />
          </div>
          <div className={styles.permissionContent}>
            <img
              src={cameraStatus === 'denied' ? quiz_game : ready}
              alt="카메라 상태 안내"
              className={
                cameraStatus === 'ready'
                  ? styles.permissionImageLarge
                  : styles.permissionImageSmall
              }
            />
            <p className={styles.permissionText}>
              {cameraStatus === 'denied' ? (
                <>
                  카메라 허용을 해주지 않으시면,
                  <br />눈 깜빡임을 측정할 수가 없어요!
                </>
              ) : (
                <>눈 깜빡임 분석을 위해 상단 팝업에서 허용을 눌러주세요!</>
              )}
            </p>
          </div>
        </div>
      )}

      {cameraStatus === 'granted' && !quizStart && (
        <EyesLayout>
          <div className={styles.quizIntroBox}>
            <p className={styles.quizLine1}>
              화면을 보고 간단한 퀴즈를 풀어주세요.
            </p>
            <p className={styles.quizLine2}>깜빡이가 눈 분석을 하고 있어요!</p>
            <div className={styles.quizButton} onClick={handleStartQuiz}>
              <img src={quiz} alt="퀴즈 아이콘" /> 퀴즈
            </div>
          </div>
        </EyesLayout>
      )}

      {allow && quizStart && (
        <div
          className={styles.container}
          style={{
            backgroundImage:
              isQuizFinished && isResultShown
                ? 'none'
                : `url(${quizbackground})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Header />
          </div>

          {isQuizFinished && !isResultShown ? (
            <div className={styles.quizEndWrapper}>
              <img
                src={endedEarly ? quizearlyend : quiz_end}
                alt="퀴즈 종료"
                className={styles.quizEndImage}
              />
              <p className={styles.quizEndText}>
                {endedEarly ? '너무 빨리 풀었어요.' : '퀴즈가 끝났어요.'}
              </p>
            </div>
          ) : isResultShown ? (
            <div className={styles.resultWrapper}>
              <img
                src={
                  correctCount >= 10
                    ? quiz_great
                    : correctCount >= 5
                    ? quiz_okay
                    : quiz_bad
                }
                alt="결과"
                className={styles.resultImage}
              />
              <p className={styles.resultScore}>{correctCount}/15</p>
              <p className={styles.resultMessage}>
                {correctCount >= 10
                  ? '훌륭해요.'
                  : correctCount >= 5
                  ? '오...'
                  : '풉... 아, 죄송합니다.'}
              </p>
            </div>
          ) : (
            <div className={styles.quizBox}>
              <div className={styles.quizBoxContent}>
                <div className={styles.quizContent}>
                  <h2 className={styles.question}>Q. {currentQuiz.question}</h2>

                  {/* 선택지 목록 */}
                  <ul className={styles.choiceList}>
                    {shuffledChoices.map((choice, index) => {
                      const isChoiceSelected = selectedChoice === choice;

                      return (
                        <li key={index} className={`${styles.choiceItem} `}>
                          <label
                            className={`${styles.choiceLabel} ${
                              selectedChoice && selectedChoice !== choice
                                ? styles.disabledChoice
                                : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name="quiz"
                              value={choice}
                              checked={isChoiceSelected}
                              onChange={() => handleChoiceClick(choice)}
                              className={styles.hiddenRadio}
                              disabled={showResult}
                            />
                            <span
                              className={`${styles.labelContent} ${
                                !isChoiceSelected
                                  ? styles.notSelectedChoice
                                  : ''
                              }}`}
                            >
                              <span
                                className={`${styles.numberPrefix} ${
                                  isChoiceSelected ? styles.selectedNumber : ''
                                }`}
                              >
                                {index + 1}
                              </span>
                              <span
                                className={`${styles.ansText} ${
                                  selectedChoice && selectedChoice !== choice
                                    ? styles.notSelectedChoice
                                    : ''
                                }`}
                              >
                                {choice}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* 퀴즈 이미지 */}
                {currentQuiz.image && (
                  <img
                    src={currentQuiz.image}
                    alt={`퀴즈 이미지 ${currentQuiz.id}`}
                    className={styles.quizImage}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {quizStart && allow && !isResultShown && !endedEarly && (
        <div className={styles.progressWrapper}>
          <div className={styles.progressTime}>{timeLabel}</div>
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBarTrack}
              style={{ '--progress': `${progress}%` }}
            >
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
                <div
                  className={styles.progressDot}
                  style={{ left: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showResult && allow && quizStart && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <img
              src={isCorrect ? correct : uncorrect}
              alt={isCorrect ? '정답' : '오답'}
              className={styles.resultImage}
            />
            <p className={styles.resultText}>
              {isCorrect
                ? '정답이에요!'
                : `오답이에요. 정답은 ${currentQuiz.answer}입니다.`}
            </p>
            <button onClick={handleNext} className={styles.modalButton}>
              다음
              <img
                src={modalnextIcon}
                alt="다음 아이콘"
                className={styles.nextIcon}
              />
            </button>
          </div>
        </div>
      )}

      {isResultShown && allow && quizStart && (
        <div className={styles.resultButtonWrapper}>
          <Link to="/result" className={styles.resultFixedNextButton}>
            <span>다음</span>
            <img
              src={modalnextIcon}
              alt="다음 아이콘"
              className={styles.nextIcon}
            />
          </Link>
        </div>
      )}
    </>
  );
};
