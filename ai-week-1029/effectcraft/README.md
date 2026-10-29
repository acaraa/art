# AI 위클리 · EffectCraft 스팅

영상 4.0~5.5초의 채널 스팅을 [EffectCraft](https://github.com/storytold/effectcraft)(오픈소스 모션그래픽 프로그램) 컴포지션으로 옮긴 것입니다. 원래는 브라우저 캔버스 코드로 그렸던 장면입니다. 이제 레이어와 키프레임으로 직접 고칠 수 있습니다. 채널 이름, 날짜, 색을 바꿔 매주 다시 쓸 수 있습니다.

## 파일

| 파일 | 내용 |
|---|---|
| `ai-weekly-sting.ecproj` | EffectCraft 프로젝트 (컴포지션 "AI 위클리 · 스팅", 1920×1080, 30fps, 2초) |
| `sting.jsx` | 프로젝트를 만드는 스크립트. 타이밍과 색이 원본 `main.js`와 같습니다 |
| `ai-weekly-sting.mp4` | EffectCraft로 렌더링한 결과 |
| `ai-weekly-sting.lottie.json` | 웹과 앱에서 쓰는 Lottie 애니메이션 |

## 레이어 구성 (위에서 아래 순서)

| 레이어 | 움직임 |
|---|---|
| Bug Caption | "WEEKLY" 글자. 로고판이 오른쪽 위에 내려앉을 때(1.38~1.50초) 나타남 |
| Glint, Plate (glint matte) | 로고판 위를 지나가는 흰 빛줄기(0.85~1.12초). 로고판 모양 매트로 잘림 |
| Plate Letters | "AI·W". 로고판의 자식 레이어로, 0.30~0.70초에 내려앉음 |
| Plate | 평행사변형 로고판(노란 그라데이션, 왼쪽에 검정·금색 막대). 0.16~0.42초 튀어나옴 → 흔들림 → 1.12~1.45초에 오른쪽 위 로고 크기(32.7%)로 이동 |
| Wordmark AI / WEEKLY, Dateline | 0.50~0.80초에 가운데에서 펼쳐지고, 1.05~1.18초에 사라짐 |
| Impact Ring | 충돌 링(0.42~0.80초) |
| Slash 1, 2 | 노란 사선 두 줄(0.04~0.30초, 0.10~0.36초) |
| Light Fins, Glow, Background | 배경 |

## 바꾸는 방법

- **채널 이름이나 날짜:** 텍스트 레이어(`Plate Letters`, `Wordmark …`, `Dateline`)를 고치면 됩니다. 스크립트를 다시 돌릴 때는 `sting.jsx` 맨 위의 값을 고칩니다.
- **색:** `sting.jsx`의 `LEMON`, `GOLD`, `INK` 값을 바꾸고 다시 실행합니다.

## 다시 만들기

```sh
effectcraft-cli script sting.jsx --empty --save-as ai-weekly-sting.ecproj
effectcraft-cli render --project ai-weekly-sting.ecproj --out ai-weekly-sting.mp4 --format h264
effectcraft-cli exec file.exportLottie --params '{"comp":"AI 위클리 · 스팅","path":"ai-weekly-sting.lottie.json"}' --project ai-weekly-sting.ecproj
```

## 글꼴

Barlow Condensed ExtraBold와 IBM Plex Mono Medium(둘 다 SIL OFL)을 컴퓨터에 설치해야 원본처럼 보입니다. 없으면 기본 글꼴로 대신 그려집니다.
- https://fonts.google.com/specimen/Barlow+Condensed
- https://fonts.google.com/specimen/IBM+Plex+Mono

Lottie를 웹에서 재생할 때도 두 글꼴을 페이지에 불러와야 합니다.

## 원본과 다른 점

- 로고판 글자는 원본처럼 한 글자씩 떨어지지 않고, 단어 전체가 한 번에 내려앉습니다.
- 배경 빛줄기는 움직이지 않습니다. 원본은 1.5초 동안 몇 픽셀 움직입니다.
