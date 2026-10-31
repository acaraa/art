# FACTS — AI 위클리 (2026-10-26 ~ 10-29)

화면에 나오는 숫자와 내레이션 문장은 모두 아래 출처에서 가져왔습니다. 확인 날짜: 2026-10-29.
openai.com, deepmind.google, blog.google 은 이 작업 환경의 네트워크에서 직접 열리지 않아, 해당 도메인만 대상으로 한 검색 결과(공식 페이지 요약)로 확인했습니다. 공개 전 원문을 한 번 더 확인하는 것을 권장합니다.

## 1. OpenAI · GPT-6.1 Terra — 2026-10-26

| 주장 | 출처 | 원문/근거 |
|---|---|---|
| 2026-10-26 출시, 컴퓨터 사용(computer use)용 모델 | https://openai.com/index/introducing-gpt-6-1-terra/ | "delivering fast and capable computer use at a lower price" (개발자 커뮤니티 공지 제목) |
| 표준 API 가격: 입력 $1.00 / 출력 $5.00 (100만 토큰당) | https://developers.openai.com/api/docs/pricing | "$1 per million input tokens … $5 per million output tokens" |
| GPT-5.6 Terra 대비 50% 낮음 | https://openai.com/index/introducing-gpt-6-1-terra/ | "standard API prices are 50% lower than those of GPT-5.6 Terra and GPT-6.1 Sol" |
| (계산) 이전 가격 입력 $2.00 / 출력 $10.00 | 위 두 항목에서 계산 | $1.00 ÷ (1 − 0.5) = $2.00, $5.00 ÷ 0.5 = $10.00. 화면에는 "50% 낮다"는 공식 표현에서 역산한 값임을 출처 줄에 표시 |

## 2. Anthropic · S-1 제출 — 2026-10-26

| 주장 | 출처 | 원문 |
|---|---|---|
| SEC에 Form S-1 등록신고서 제출 | https://www.anthropic.com/news/s1-sec | "Anthropic, PBC filed a registration statement on Form S-1 with the U.S. Securities and Exchange Commission" |
| 나스닥 글로벌 셀렉트, 티커 ANT | 같은 페이지 | "intends to list its Class A common stock on the Nasdaq Global Select Market under the symbol "ANT."" |
| 공모가 범위 미정 | 같은 페이지 | "the price range for the proposed offering have not yet been determined" |
| 아직 효력 발생 전 | 같은 페이지 | "has not yet become effective" |

보도(Fox News 등)에만 나오는 S-1 세부 내용(보안 사고 등)은 공식 페이지에서 확인하지 못해 쓰지 않았습니다.

## 3. NVIDIA · Oracle · Vera Rubin — 2026-10-27

| 주장 | 출처 | 원문/근거 |
|---|---|---|
| 2026-10-27 Oracle AI World(라스베이거스) 발표, OCI 슈퍼클러스터의 Vera Rubin NVL72를 멀티 기가와트 규모로 확대 | https://www.oracle.com/news/announcement/ai-world-nvidia-and-oracle-expand-nvidia-vera-rubin-to-multi-gigawatt-scale-2026-10-27/ , https://nvidianews.nvidia.com/news/nvidia-and-oracle-expand-nvidia-vera-rubin-to-multi-gigawatt-scale-and-bring-nvidia-vera-cpu-to-oracle-cloud-infrastructure | 제목 "NVIDIA and Oracle Expand NVIDIA Vera Rubin to Multi-Gigawatt Scale…" |
| 2027년 말까지 NVIDIA GPU 용량 3GW 이상 계획, GPU 100만 개 이상 | https://www.oracle.com/ai-infrastructure/ | "more than 1 million NVIDIA GPUs, with more than 3 gigawatts of NVIDIA GPU capacity planned by the end of 2027" (검색 요약) |

계약 금액은 발표에 없어 다루지 않았습니다.

## 4. Google DeepMind · Genie 4 — 2026-10-27

| 주장 | 출처 | 원문/근거 |
|---|---|---|
| 2026-10-27 발표, 실시간 상호작용 세계 생성 모델 | https://deepmind.google/blog/genie-4-a-new-generation-of-world-simulation/ , https://blog.google/innovation-and-ai/models-and-research/google-deepmind/introducing-genie-4/ | "our new world model for real-time interactive simulation" |
| 연구 프리뷰, 일부 신뢰 테스터 대상 | 같은 페이지 | "research preview … trusted testers" (검색 요약) |
| 소리(배경음·음악·대사)도 함께 생성, 텍스트로 장면 조정 | 같은 페이지 | native audio; steer with natural language (검색 요약) |

## 화면의 계산·도식

- GPU 격자: 1칸 = GPU 1,000개, 1,000칸 = 100만 개. 실제 배치가 아닌 개념도이므로 `SCHEMATIC / 개념도` 태그를 붙임.
- Genie 4 화면의 와이어프레임 지형은 코드로 그린 일러스트이며 Genie 4의 실제 출력이 아님. `ILLUSTRATION / 일러스트` 태그를 붙임.
