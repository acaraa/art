---
name: ai-weekly-news
description: >
  @noah.aiart의 "AI 위클리" 방송 뉴스 영상 제작 전 과정. 그 주의 AI 뉴스 4개를 공식 출처로 확인하고, Typecast 한국어 내레이션과
  lemo-opuscar "Broadcast News Package" 스타일 그래픽으로 60~70초 영상을 만들어, FilmCraft·EffectCraft 프로젝트와 유튜브 업로드 정보까지
  준비한다. "이번 주 AI 뉴스", "AI 위클리", "주간 AI 소식 영상", "뉴스 영상 만들어줘", "지난주처럼 뉴스", "다음 회차", "뉴스 패키지",
  "세로판 뉴스(릴스)" 같은 요청이면, 형식을 명시하지 않아도 이 스킬을 쓴다. 다른 주제의 뉴스·브리핑 영상(예: 특정 분야 주간 소식)에도
  이 흐름을 그대로 적용한다.
---

# AI 위클리 — 주간 AI 뉴스 영상 만들기

첫 회차 `ai-week-1029/`(2026년 10월 마지막 주, https://youtu.be/V8rwZ4BBMQk)를 만든 과정을 정리한 것이다. 새 회차는 그 폴더를 **틀로 복사해서** 내용만 바꾼다. 처음부터 다시 짜지 않는다. 그래야 패키지 부품(스트랩, 런다운, 와이프, 스팅), 음악 구조, 검수 과정이 매주 같은 품질로 유지된다.

저장소 규칙(`CLAUDE.md`)이 먼저다: 한국어로 답한다, 모든 영상에 `@noah.aiart`를 넣는다, 회사 로고는 쓰지 않는다, 사실은 `FACTS.md`에 출처와 원문을 적는다.

## 0. 준비 (새 세션마다)

```sh
sh tools/setup.sh          # lemo-opuscar, 샘플 음원, Craft CLI, 글꼴 (Craft 빌드가 앱마다 4~13분)
. tools/env.sh             # $LIB, PATH
```
뉴스 영상에 꼭 필요한 것은 `setup.sh lemo`와 `setup.sh fonts`다. FilmCraft·EffectCraft 프로젝트까지 만들 때만 `crafts`를 돌린다.

## 1. 브리프 (한 번만 묻기)

사용자가 이미 말한 것은 묻지 않는다. 비어 있으면 아래 기본값으로 진행하고 한 줄로 알린다.

| 항목 | 기본값 |
|---|---|
| 기간 | 오늘 기준 지난 월~목 (주차는 ISO 주) |
| 기사 수 | 4개 (모델·시장·인프라·연구처럼 분류가 겹치지 않게) |
| 형태 | 가로 1920×1080, 30fps, 60~70초. "릴스·숏폼·세로"면 1080×1920으로 레이아웃을 다시 짠다 |
| 음성 | Typecast "Jinhee" (`tc_6731b2b2478a48710ecc9158`), tempo 1.05. 계정 커스텀 음성 "편해윤"도 있음 |
| 유튜브 설명 첫 줄 | `- 서강대학교 미래교육원 학습용 예시 영상` (첫 회차에서 사용자가 지정) |

## 2. 뉴스 고르기와 사실 확인

1. `WebSearch`(extended)로 그 주 소식을 넓게 찾는다. 집계 사이트는 날짜가 자주 틀리니 **후보 찾기에만** 쓴다.
2. 후보마다 회사의 **공식 페이지**에서 확인한다. 이 환경에서는 openai.com, deepmind.google, blog.google 같은 곳을 `WebFetch`로 열 수 없는 경우가 많다. 그때는 `WebSearch`에 `allowed_domains`를 그 공식 도메인으로 걸어 검색하면 공식 페이지 내용이 요약되어 나온다. 이렇게 확인했다는 사실을 `FACTS.md` 머리말에 적는다.
3. 보도에만 있는 내용(특히 실제 회사에 대한 의혹·사고)은 쓰지 않는다. 꼭 필요하면 화면과 음성에 "~에 따르면"을 붙인다.
4. 숫자를 역산하거나 도식화했다면(예: "50% 낮음"에서 이전 가격 계산, GPU 격자) 그렇게 했다는 것을 화면의 출처 줄과 `FACTS.md`에 남긴다.
5. 저는 Anthropic이 만든 AI다. Anthropic 소식을 넣을 때는 다른 회사 소식과 같은 기준(공식 발표의 사실만)으로 다루고, 사용자에게 그 점을 한 줄 밝힌다.

## 3. 새 회차 폴더 만들기

```sh
sh .claude/skills/ai-weekly-news/scripts/new_week.sh ai-week-1029 ai-week-1105
```
이전 회차의 소스(`main.js`, `mix.py`, `tools/`, `index.html`, `build.sh`, `effectcraft/`, `filmcraft/build*`, `soundcraft/`의 스크립트)를 복사하고, 결과물·음성·글꼴 파일은 비운다. 그다음 `build.sh`, `tools/subs.py`, `filmcraft/build.sh` 안의 이전 폴더 이름을 새 이름으로 바꾼다(스크립트가 알려줌).

## 4. 트리트먼트 (`TREATMENT.md`)

lemo-opuscar 규칙대로 후보 구조 3개 → 선택과 이유 → 샷 리스트 → 큐 맵 → 사운드 표를 쓴다. 매주 같은 영상처럼 보이지 않게 **오프닝 방식이나 대표 장면 하나는 바꾼다.** 스타일 문서(`$LIB/styles/news-package/STYLE.md` §12)의 변주를 고르면 된다.
- 오프닝: 콜드 오픈(가장 강한 숫자로 시작) / 스팅 → 런다운 / 스팅에서 바로 첫 기사
- 엔딩: 런다운 체크 → 엔드카드 / 다음 주 예고 카드 / 마지막 스탬프에서 멈춤
- 첫 회차에서 쓴 것: 콜드 오픈(가격판) + 다음 주 예고. 대표 장면은 GPU 격자에서 한 박자 무음 뒤 "3 GW+"

## 5. 내레이션

1. `vo/lines.json`: 그래픽 하나에 한 문장. `text`는 화면·자막용, `say`는 읽는 소리용이다. 영어 이름과 숫자는 한국어로 풀어 쓴다(`GPT-6.1 Terra` → "지피티 육 점 일 테라", `100만` → "백만", `ANT` → "에이 엔 티").
2. `python3 tools/tts_typecast.py` → `vo/*.wav`, `vo/dur.json`. API 키는 세션 프록시가 넣어 준다.
3. **음성 길이를 먼저 재고 그다음 타임라인을 잡는다.** 컷은 120 BPM 반박(0.5초) 위에 두고, 각 문장은 컷 0.1초 뒤에 시작한다.
4. Whisper 음성 검수는 이 환경에서 모델을 못 받아 실패한다. 실패하면 사용자에게 "발음을 한 번 들어봐 달라"고 알린다.

## 6. 화면 (`main.js`)

이전 회차의 `main.js`에서 바꿀 곳:
- `STRAP.items`(분류 탭과 헤드라인), `ROWS`(런다운), `SOURCES`(출처 줄), `TAGS`(ILLUSTRATION/SCHEMATIC 태그), `VO_AT`, `EV`, 날짜·주차 문자열
- 기사별 `shot…()` 함수. 한 화면에 사실 하나만 둔다. 무엇 → 얼마나 → 누구에게 → 판정 스탬프 순서
- 그대로 둘 것: `plate`, `strap`, `flipTile`, `stamp`, `pushUp`, `wipe`, `layer`, 스팅, 엔드카드 구조, `HANDLE`(`@noah.aiart` — 로고 아래, 스트랩 끝, 엔드카드 "제작 @noah.aiart")

글자를 바꾼 뒤에는 `rm fonts/*.woff2 && sh tools/fonts.sh`로 한국어 글꼴 서브셋을 다시 만든다. 이걸 빼먹으면 새 글자가 네모로 나온다.

## 7. 검수 → 렌더 → 소리

```sh
cd $LIB
node core/render/still.mjs <폴더> <시점들…>                  # 장면별 확인 → sheet.py로 컨택트 시트
node core/render/readcheck.mjs <폴더> --step 0.05           # 런다운 미리보기 줄의 BAD만 허용 (STYLE.md §11)
node core/render/events.mjs <폴더>
node core/render/video.mjs <폴더> --fps 30 --workers 4 --out <폴더>/out/video.mp4
$LIB/.venv/bin/python <폴더>/mix.py                         # 음악 스코어는 매주 조금씩 바꿔도 됨 (조성, 무음 박자 위치)
sh core/render/mux.sh <폴더>/out/video.mp4 <폴더>/out/mix.wav <폴더>/<이름>.mp4 30 0
$LIB/.venv/bin/python <폴더>/tools/subs.py
```
확인할 것: 컨택트 시트, 핵심 동작 0.2초 간격 스트립, 검은 프레임 0, −14 LUFS, 무음 박자가 실제로 비었는지(RMS), 레이아웃이 서로 겹치지 않는지. 이전 회차 영상과 나란히 놓고 구조·오프닝·대표 장면이 충분히 다른지도 본다.

## 8. 편집용 프로젝트 (사용자가 Craft 앱을 쓰므로 매주 갱신)

- **FilmCraft**: `filmcraft/build.sh --no-export`. 소리 파일을 FLAC로 만들고, 프로젝트 안의 경로를 상대 경로로 바꾼다. 내보낼 때는 음량 정규화를 켠다. 세 소리 트랙을 그대로 더하면 0 dBFS를 넘기 때문이다.
- **EffectCraft 스팅**: `effectcraft/sting.jsx`에서 주차·날짜 문자열만 고치고 `effectcraft-cli script sting.jsx --empty --save-as …`로 다시 만든 뒤, mp4와 Lottie도 다시 내보낸다. Barlow Condensed, IBM Plex Mono 글꼴이 설치되어 있어야 한다.
- **SoundCraft**: 사용자가 원할 때만 만든다. 첫 회차에서 사용자는 원래 믹스와 차이를 느끼지 못했다.

## 9. 업로드 준비와 전달

- `UPLOAD.md`: 제목(100자 이내), 설명(첫 줄 학습용 문구 → 요약 → 챕터 → 출처 → 제작 정보 → "제작 @noah.aiart" → 해시태그), 태그, YouTube Studio 순서. 챕터는 00:00에서 시작하고 각 10초 이상이어야 유튜브가 인식한다.
- 유튜브 업로드는 직접 할 수 없다(vidIQ는 기존 영상 수정만 가능, 채널도 미연결). 사용자가 올리고 주소를 주면 `README.md` 영상 표와 `UPLOAD.md`에 링크를 적는다.
- 커밋하고 지정된 브랜치에 푸시한 뒤 PR을 연다. 렌더 중간 파일(`out/`, `stills/`, `events.json`)은 커밋하지 않는다.
- 사용자 컴퓨터는 Windows이고, 저장소는 `D:\noah-studio\art`에 GitHub Desktop으로 연결되어 있다(로그인 계정 `kca0210`, 받는 곳은 `upstream` = `acaraa/art`). 결과를 알릴 때 "GitHub Desktop에서 Fetch → Pull"을 함께 안내한다.

## 첫 회차에서 배운 것

| 겪은 일 | 대응 |
|---|---|
| 집계 사이트마다 출시 날짜가 다름 | 공식 페이지 날짜만 쓴다 |
| Typecast가 영어 약어를 영어식으로 읽음 | `say`에 한국어 발음으로 풀어 쓴다 |
| 패널 뒤로 제목이 비침 | 대표 장면 직전 무음 박자 동안 제목 열을 밀어낸다 |
| 짧게 보이는 글자가 readcheck에서 걸림 | 등장을 앞당기거나 문구를 줄인다. 엔드카드 크레딧은 짧게, 영상 끝을 늘린다 |
| FilmCraft에서 소리가 깨짐(+2.3 dBFS) | 내보낼 때 음량 정규화(−14 LUFS, −1.2 dBTP) |
| EffectCraft 텍스트가 기본 글꼴로 나옴 | `tools/setup.sh fonts`로 OFL 글꼴 설치 |
| 런처 OPEN 버튼 오류(D 드라이브 설치) | 앱은 시작 메뉴로 열면 된다고 안내 |
