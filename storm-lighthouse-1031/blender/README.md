# 폭풍 속 등대 — 블렌더 장면

`scene.py` 하나로 장면 전체(바다, 절벽, 등대, 빛줄기, 배, 번개, 카메라 7대)를 만듭니다. 외부 파일은 필요 없습니다.
블렌더 3.6 ~ 5.x에서 돌아가도록 썼고, 블렌더 5.2.3(파이썬 모듈)으로 장면 생성과 시험 렌더를 확인했습니다.

| 샷 | 프레임 (24fps) | 초 | 내용 |
|---|---|---|---|
| S1 | 1–240 | 0–10 | 폭풍 속 작은 배, 멀리 등대 (번개 150프레임) |
| S2 | 241–408 | 10–17 | 배 선실 불빛이 깜빡임 (망원) |
| S3 | 409–600 | 17–25 | 절벽 위 등대, 다가가기 |
| S4 | 601–792 | 25–33 | 등대 램프를 올려다봄, 빛이 돎 |
| S5 | 793–1104 | 33–46 | 빛줄기가 바다를 훑다가 배를 찾음 (번개 1000프레임) |
| S6 | 1105–1250 | 46–52 | 배가 등대 쪽으로 방향을 틀고, 선실 불이 안정됨 |
| S7 | 1251–1440 | 52–60 | 크게 물러나며 끝 |

## 렌더하는 방법

### 방법 A: 블렌더 화면에서
1. 블렌더를 엽니다(새 파일).
2. 위쪽 **Scripting** 탭 → 가운데 텍스트 창의 **Open** → `scene.py` 선택 → **Run Script**(▶).
3. 다 만들어지면 **Render → Render Animation**(Ctrl+F12).
4. 프레임이 `blender\render\f_0001.png` … `f_1440.png`로 저장됩니다.

### 방법 B: 명령줄 (PowerShell, PC의 Claude Code/agent-desktop용)
```powershell
cd D:\noah-studio\art\storm-lighthouse-1031\blender
& "C:\Program Files\Blender Foundation\Blender 4.x\blender.exe" -b -P scene.py -- --render
```
`Blender 4.x`는 설치된 폴더 이름에 맞게 바꿉니다. 먼저 `-- --stills 120 500 1052` 로 세 장만 뽑아 보고 확인하는 것을 권합니다.

### 설정
- GPU: 블렌더 **Edit → Preferences → System → Cycles Render Devices**에서 CUDA/OptiX(NVIDIA) 또는 HIP(AMD)를 켜 두면 스크립트가 GPU를 씁니다.
- 품질과 시간: 환경 변수 `SAMPLES`(기본 128), `OCEAN_RES`(파도 해상도, 기본 14). 느리면 `SAMPLES=48`로 낮춥니다.
- 렌더가 끝나면 `blender\render` 폴더를 압축해서 대화에 올리거나 알려 주세요. 그 뒤 실사 변환, 편집, 음악, 자막은 클라우드 쪽에서 합니다.

이 단계는 실사 변환의 바탕이 되는 회색 모형(구도, 움직임, 빛의 방향)입니다. 비와 안개, 질감은 다음 단계(AI 실사 변환)에서 더합니다.
