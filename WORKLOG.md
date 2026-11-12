## @noah.aiart 영상 제작 스튜디오 — 작업 기록 (10월 29일 ~ 11월 12일)

### 1. 스튜디오 준비 (10/29)
| 작업 | 결과 |
|---|---|
| 도구 설치 | lemo-opuscar(영상 스타일 66종), Craft 앱 명령줄 도구 8개(Film·Effect·Sound·Photo·Light·Vector·Design·Deck), craft-fonts, OFL 글꼴 |
| 저장소 정리 | `acaraa/art`를 "모든 영상 제작방"으로: `CLAUDE.md`(작업 규칙), `README.md`(영상 목록), `tools/setup.sh`(새 세션 설치) |
| 사용자 PC | FilmCraft·EffectCraft·SoundCraft를 `D:\noah-studio`에 설치. 런처의 OPEN 버튼 오류는 시작 메뉴로 열어서 해결 |
| 스킬 | `ai-weekly-news`: 주간 뉴스 영상 제작 과정을 스킬로 저장 |

### 2. 영상 1편 — AI 위클리 · 10월 마지막 주 ✅ 게시
- **형식:** 68초, 가로 1920×1080, Broadcast News Package 스타일, Typecast "Jinhee" 내레이션
- **내용:** GPT-6.1 Terra, Anthropic S-1, NVIDIA·Oracle Vera Rubin, Genie 4
- **함께 만든 것:** FilmCraft 편집 프로젝트, EffectCraft 스팅(오프닝 로고), SoundCraft 믹싱 세션, `FACTS.md`(출처와 원문)
- **게시:** https://youtu.be/V8rwZ4BBMQk (설명 첫 줄 "서강대학교 미래교육원 학습용 예시 영상")
- **폴더:** `ai-week-1029/`

### 3. 스도쿠 웹 게임 (10/29)
- 브라우저에서 하는 스도쿠. 쉬움·보통·어려움, 메모, 힌트, 되돌리기 기능
- 링크: https://claude.ai/artifact/J4RUchq7MiFAr6Kk2ALDfH (비공개)

### 4. 영상 2편 — AI는 스도쿠를 몇 초 만에 풀까 ✅ 게시
- **형식:** 39초, 세로 쇼츠 1080×1920, ASCII/CRT 터미널 스타일, Jinhee 내레이션, 음악·효과음은 코드로 합성
- **실제로 잰 숫자:** 0.04초(38.9ms), 숫자를 대 본 횟수 1,988,853번, 되돌아간 횟수 220,953번
- **게시:** https://youtube.com/shorts/qorHzcS22dI
- **썸네일 수정(11/1):** 디자인 평가(`/design-critique`) → 정답을 숨긴 질문형 → "200만번 돌려봤다"로 바꿈. "틀렸다"는 실제보다 부풀린 표현이라 쓰지 않음(실제로 틀린 횟수는 약 177만 번)
- **폴더:** `sudoku-ai-1030/`

### 5. 영상 3편(이 세션) — 폭풍 속 등대 ⏳ 진행 중
- **이야기:** 폭풍 속 작은 배를 등대 불빛이 찾아냄. 1분, 7샷
- **완료:** 블렌더 장면 스크립트 `storm-lighthouse-1031/blender/scene.py`. 사용자 PC(soreapt)에서 미리보기 품질(960×540)로 렌더 시작(11/1, 약 2시간 예정)
- **확인 안 됨:** 렌더가 끝났는지, 그 결과물
- **남은 일:** 렌더 결과 받기 → 실사 변환(유료, 비용 먼저 확인) → 편집·음악·자막
- **렌더 위치(PC):** `D:\noah-studio\art\storm-lighthouse-1031\blender\render\`

### 6. NOAH AI 시리즈 3편 — 오늘(11/12) 여기서 한 일
원래 PC 쪽 세션에서 하던 작업입니다(`E:\AI 영상 편집자`).
| 작업 | 결과 |
|---|---|
| 파일 위치 찾기 | 이전 세션 기록에서 폴더와 파일 경로를 찾음 |
| 진행 점검 | PC 쪽 점검 보고서(PDF)를 받아 정리: 대본 ✅ · 이미지 ✅ · 음성·편집·썸네일·업로드 ✗ |
| **나레이션 생성** | Typecast 은빈(ssfm-v31), 4분 24초, 장면 13개, 시작 시각표, 자막(.srt). 약 2,180자 사용 |
| 남은 일 | 나레이션을 PC의 `원본 영상\음성\`에 넣기, 화면 녹화 R1·R2, 편집, 썸네일, 업로드 정보 |

### 7. 저장소와 PR
| PR | 내용 | 상태 |
|---|---|---|
| [acaraa/art#1](https://github.com/acaraa/art/pull/1) | 스튜디오 설정, 영상 1·2편, 스킬 | 병합 완료(10/31) |
| [acaraa/art#2](https://github.com/acaraa/art/pull/2) | 폭풍 등대 블렌더 장면, 스도쿠 썸네일 수정 | 초안, 병합 전 |

### 8. 알게 된 제약
- 이 세션은 클라우드라서 **사용자 PC 파일을 직접 열 수 없습니다.** Windows PC는 원격 연결 대상이 아닙니다.
- 음성 검수(Whisper)는 이 환경에서 할 수 없어서, 발음은 직접 들어 봐야 합니다.
- 유튜브 업로드는 직접 하셔야 합니다.
- vidIQ는 유료라서 쓰기 전에 꼭 여쭙기로 했습니다.

### 지금 바로 챙길 것 (2026-11-12 기준)
1. **NOAH AI 3편 나레이션 파일 4개 내려받기.** 이 세션의 임시 폴더에 있어서, 세션이 끝나면 지워질 수 있습니다.
2. **폭풍 등대 렌더 결과 확인:** PC의 `render` 폴더에 `f_1440.png`까지 있는지 봐 주세요.
3. **PR #2 병합 여부 결정.**
