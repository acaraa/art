# AI 위클리 · FilmCraft 프로젝트

[FilmCraft](https://github.com/storytold/filmcraft)(오픈소스 영상 편집 프로그램)에서 AI 위클리 영상을 다시 편집할 수 있게 만든 프로젝트입니다.

## 타임라인 구성

| 트랙 | 내용 | 파일 |
|---|---|---|
| V1 | 화면 (소리 없이 영상만) | `../ai-week-1029.mp4` |
| A1 | 내레이션 (Typecast 음성) | `media/stem_vo.flac` |
| A2 | 음악 (음성 구간에서 이미 줄여 둔 상태) | `media/stem_music.flac` |
| A3 | 효과음 + 배경음 | `media/stem_sfx.flac` |
| 자막 | 한국어 자막 14개 | `../ai-week-1029.srt`에서 가져옴 |

- 시퀀스: 1920×1080, 30 fps, 68초 (2,040프레임)
- 미디어 경로는 프로젝트 파일 기준 상대 경로라서, 저장소를 받은 그대로 열면 됩니다.
- 자막 트랙은 편집과 `.srt` 내보내기용입니다. 스타일 규칙에 따라 영상에 새기지 않습니다.

## 여는 방법

1. FilmCraft를 설치합니다 ([릴리스](https://getartcraft.com/apps/filmcraft) 또는 소스 빌드).
2. `ai-week-1029.fcproj`를 엽니다.

## 다시 만들기 / 내보내기

```sh
FILMCRAFT=/path/to/filmcraft-cli sh build.sh
```

- 프로젝트를 새로 만들고 `../out/ai-week-1029-filmcraft.mp4`로 내보냅니다.
- 내보낼 때 음량 정규화(−14 LUFS, 최대 −1.2 dBTP)를 켭니다. 세 소리 트랙을 그대로 더하면 0 dBFS를 넘기 때문입니다. 정규화를 끄면 최대 레벨이 +2.3 dBFS까지 올라가 소리가 깨집니다.
- `--no-export`를 붙이면 프로젝트만 만듭니다.

## 확인한 결과 (FilmCraft 0.14.0)

| 항목 | 원본 (`ai-week-1029.mp4`) | FilmCraft 내보내기 |
|---|---|---|
| 길이 | 68.0초, 2,040프레임 | 68.0초, 2,040프레임 |
| 음량 | −14.0 LUFS, 최대 −2.3 dBFS | −14.0 LUFS, 최대 −1.1 dBFS |
| 화면 차이 (PSNR) | — | 47.7 dB (눈으로 구분하기 어려운 수준) |
