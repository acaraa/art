# AI 위클리 · SoundCraft 세션

[SoundCraft](https://github.com/storytold/soundcraft)(오픈소스 오디오 편집·믹싱 프로그램)로 AI 위클리 소리를 다시 믹스하는 세션입니다. 원래 믹스는 `../mix.py`가 한 번에 계산했습니다. 이 세션에서는 트랙별 처리와 음악 볼륨 조절을 프로그램 안에서 직접 고칠 수 있습니다.

## 세션 구성

| 트랙 | 처리 |
|---|---|
| ai-week-1029 (영상) | 완성 영상. 화면을 보며 편집 |
| 내레이션 | EQ 7-Band(90Hz 아래 제거, 300Hz −2dB, 3.5kHz +1.5dB) → 디에서(6.5kHz) → 컴프레서(3:1) |
| 음악 | EQ(2.5kHz −3dB, 목소리 자리 비우기) + **볼륨 자동화**: 내레이션 14줄마다 −7dB (0.08초 내려가고 0.15초 올라옴) |
| 효과음 | 그대로 |
| 원본 믹스 (비교용) | 완성 영상의 원래 소리. 음소거 상태이며, 켜서 비교할 수 있음 |
| Master 1 | 맥시마이저(임계값 −3.8dB, 최대 −1.5dB) → −14 LUFS |

## 결과

| 항목 | 원본 (`mix.py`) | SoundCraft |
|---|---|---|
| 음량 | −14.0 LUFS | −14.0 LUFS |
| 실제 최대 레벨 (true peak) | — | −1.19 dBTP |
| 음악 줄이기 | 파일에 굳어 있음 | 자동화 곡선이라 점을 옮기면 바로 바뀜 |

`ai-week-1029-soundcraft.mp4`는 같은 화면에 SoundCraft 믹스를 입힌 비교용 영상입니다. 들어보고 더 나은 쪽을 고르시면 됩니다.

## 다시 만들기

```sh
. tools/env.sh                       # 저장소 맨 위에서
sh ai-week-1029/soundcraft/build.sh
```

- `make_session.py`가 명령 목록(`session.txt`)을 만들고, `soundcraft-cli`가 그 명령을 실행해 세션을 만듭니다.
- 결과 세션(`ai-week-1029.scraft`와 `Audio Files/`, 약 100MB)은 커밋하지 않습니다. 필요할 때 만들어 SoundCraft 앱에서 엽니다.
- 음량을 바꾸려면 `python3 make_session.py --threshold -3.0`처럼 맥시마이저 임계값을 바꿉니다. 0에 가까울수록 작아집니다.

## 입력 파일

- `media/stem_music_dry.flac`: 볼륨을 줄이기 전의 음악 (`../mix.py`가 만듦)
- `media/vo_spans.json`: 내레이션 각 줄의 시작·끝 시각
- `../filmcraft/media/stem_vo.flac`, `stem_sfx.flac`: 내레이션, 효과음
