/**
 * digest.mjs 순수 로직 테스트.
 *
 * 실행: node --test scripts/digest.test.mjs   (Node 내장 테스트 러너, 의존성 없음)
 *
 * 여기서 확인하는 건 "규칙이 매번 똑같이 적용되는가"다. 상태 전이와 출제 비율은
 * 사람이 눈으로 검사하기 어렵고 한 번 어긋나면 조용히 계속 어긋나기 때문에,
 * 이 부분만큼은 코드로 못 박아 둔다.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDecay,
  applyScore,
  selectQuestions,
  subjectWeight,
  parseKnowledge,
  parseSyllabus,
  daysBetween,
  todayString,
} from './digest.mjs';

const TODAY = '2026-09-02';

const CONFIG = {
  questions_per_session: 6,
  mix: { wrong: 2, unknown: 1, gap: 1, unchecked: 1, known: 1 },
  difficulty_floor: { 기초: 1, 실무: 2 },
  difficulty_cap: { 기초: 3, 심화: 2 },
  subject_weight: { 'platform/*': 0.4, 'cs/network': 0.3, 'cs/os': 0.3 },
  cooldown_days: 3,
  known_decay_days: 60,
  max_per_subject: 3,
};

/** 테스트용 문항 하나를 만든다. 필요한 값만 덮어쓰면 된다. */
function q(id, overrides = {}) {
  return {
    id,
    subject: 'cs/os',
    difficulty: '실무',
    title: `${id} 제목`,
    status: 'unseen',
    answered: false,
    attempts: 0,
    streak: 0,
    last_asked: null,
    gaps: [],
    history: [],
    ...overrides,
  };
}

/** 며칠 전 날짜를 YYYY-MM-DD로. */
function daysAgo(n) {
  const base = Date.parse(`${TODAY}T00:00:00Z`) - n * 86400000;
  return todayString(new Date(base + new Date().getTimezoneOffset() * 60000));
}

/* ───────────────────────────── 상태 전이 ───────────────────────────── */

test('점수는 상태로 정확히 옮겨진다', () => {
  assert.equal(applyScore(q('A-1'), 0, [], TODAY).status, 'wrong');
  assert.equal(applyScore(q('A-1'), 1, [], TODAY).status, 'wrong');
  assert.equal(applyScore(q('A-1'), 2, [], TODAY).status, 'shaky');
  assert.equal(applyScore(q('A-1'), 3, [], TODAY).status, 'shaky');
});

test('만점을 한 번 받아도 숙지로 직행하지 않는다', () => {
  const first = applyScore(q('A-1', { status: 'wrong' }), 4, [], TODAY);
  assert.equal(first.status, 'shaky', '오답에서 만점 한 번은 불안정까지만');
  assert.equal(first.streak, 1);

  const second = applyScore(first, 4, [], TODAY);
  assert.equal(second.status, 'known', '연속 두 번째 만점에서 숙지로 승격');
  assert.equal(second.streak, 2);
});

test('만점이 아니면 연속 기록이 초기화된다', () => {
  const known = applyScore(applyScore(q('A-1'), 4, [], TODAY), 4, [], TODAY);
  assert.equal(known.status, 'known');
  const slipped = applyScore(known, 2, [], TODAY);
  assert.equal(slipped.status, 'shaky');
  assert.equal(slipped.streak, 0, '한 번 미끄러지면 처음부터 다시 쌓아야 한다');
});

test('미응답은 상태도 시도 횟수도 건드리지 않는다', () => {
  const before = q('A-1', { status: 'wrong', attempts: 3, streak: 0 });
  const after = applyScore(before, null, [], TODAY);
  assert.deepEqual(after, before, '답을 안 쓴 것은 틀린 것이 아니다');
  assert.equal(applyScore(before, undefined, [], TODAY).attempts, 3);
});

test('채점하면 시도 횟수와 이력이 쌓이고 지적 사항이 갱신된다', () => {
  const after = applyScore(q('A-1', { attempts: 2 }), 2, ['마지막 ACK 누락'], TODAY);
  assert.equal(after.attempts, 3);
  assert.equal(after.last_score, 2);
  assert.equal(after.last_graded, TODAY);
  assert.deepEqual(after.gaps, ['마지막 ACK 누락']);
  assert.deepEqual(after.history.at(-1), { date: TODAY, score: 2 });
});

test('이력은 최근 20건까지만 남긴다', () => {
  let item = q('A-1');
  for (let i = 0; i < 25; i += 1) item = applyScore(item, 3, [], TODAY);
  assert.equal(item.history.length, 20);
});

/* ────────────────────────────── 감쇠 ────────────────────────────── */

test('숙지는 정해진 기간이 지나야 내려간다', () => {
  const fresh = applyDecay(q('A-1', { status: 'known', streak: 2, last_asked: daysAgo(59) }), CONFIG, TODAY);
  assert.equal(fresh.status, 'known', '59일은 아직 유효');

  const stale = applyDecay(q('A-1', { status: 'known', streak: 2, last_asked: daysAgo(61) }), CONFIG, TODAY);
  assert.equal(stale.status, 'shaky', '61일이면 불안정으로');
  assert.equal(stale.streak, 1, '한 번만 더 맞히면 숙지로 돌아올 수 있게 남겨 둔다');
  assert.equal(stale.decayed, true);
});

test('숙지가 아닌 상태는 감쇠하지 않는다', () => {
  const item = q('A-1', { status: 'wrong', last_asked: daysAgo(400) });
  assert.deepEqual(applyDecay(item, CONFIG, TODAY), item);
});

/* ───────────────────────────── 문항 선정 ───────────────────────────── */

/** 비율 검증용 표본. 오답 3 · 불안정 2 · 미학습 6 · 숙지 2. */
function sampleQuestions() {
  return [
    q('OS-001', { status: 'wrong', attempts: 2, difficulty: '기초', last_asked: daysAgo(10) }),
    q('OS-002', { status: 'wrong', attempts: 1, difficulty: '심화', last_asked: daysAgo(9) }),
    q('NET-001', { status: 'wrong', attempts: 1, subject: 'cs/network', difficulty: '실무', last_asked: daysAgo(8) }),
    q('NET-002', { status: 'shaky', attempts: 1, subject: 'cs/network', difficulty: '실무', last_asked: daysAgo(7) }),
    q('AND-001', { status: 'shaky', attempts: 1, subject: 'platform/android', difficulty: '기초', last_asked: daysAgo(6) }),
    q('AND-002', { status: 'unseen', subject: 'platform/android', difficulty: '실무' }),
    q('AND-003', { status: 'unseen', subject: 'platform/android', difficulty: '심화' }),
    q('AND-004', { status: 'unseen', subject: 'platform/android', difficulty: '심화' }),
    q('OS-003', { status: 'unseen', difficulty: '실무' }),
    q('OS-004', { status: 'unseen', difficulty: '기초' }),
    q('NET-003', { status: 'unseen', subject: 'cs/network', difficulty: '실무' }),
    q('OS-005', { status: 'known', attempts: 4, streak: 2, difficulty: '실무', last_asked: daysAgo(30) }),
    q('NET-004', { status: 'known', attempts: 5, streak: 2, subject: 'cs/network', difficulty: '기초', last_asked: daysAgo(50) }),
  ];
}

const SAMPLE_GAPS = [
  { subject: 'cs/algorithms', topic: '퀵 정렬의 최악 조건' },
  { subject: 'cs/network', topic: 'TLS 핸드셰이크' },
];

test('설정한 슬롯 비율대로 뽑는다', () => {
  const { picks } = selectQuestions({ questions: sampleQuestions(), gaps: SAMPLE_GAPS, config: CONFIG, today: TODAY });
  assert.equal(picks.length, 6);
  const bySlot = (slot) => picks.filter((p) => p.slot === slot).length;
  assert.equal(bySlot('wrong'), 2);
  assert.equal(bySlot('unknown'), 1);
  assert.equal(bySlot('unchecked'), 1);
  assert.equal(bySlot('known'), 1);
  assert.equal(bySlot('gap'), 1);
});

test('답이 빈 문항과 답을 적어 둔 문항을 각각 따로 뽑는다', () => {
  // 답이 빈 문항이 압도적으로 많아도, 정리해 둔 문항이 반드시 한 번은 나와야 한다.
  const questions = Array.from({ length: 30 }, (_, i) =>
    q(`X-${100 + i}`, { subject: `cs/s${i % 6}`, status: 'unseen', answered: false, difficulty: '기초' }),
  );
  questions.push(q('DONE-001', { subject: 'cs/done', status: 'unseen', answered: true, difficulty: '실무' }));

  const { picks } = selectQuestions({ questions, gaps: [], config: CONFIG, today: TODAY });
  const unknownPick = picks.find((p) => p.slot === 'unknown');
  const uncheckedPick = picks.find((p) => p.slot === 'unchecked');

  assert.equal(unknownPick.id.startsWith('X-'), true, '답이 빈 문항에서 뽑혀야 한다');
  assert.equal(uncheckedPick.id, 'DONE-001', '수가 적어도 정리해 둔 문항이 밀려나면 안 된다');
});

test('정리해 둔 문항이 하나도 없으면 답이 빈 문항으로 대체한다', () => {
  const DIFFS = ['기초', '실무', '실무', '심화'];
  const questions = Array.from({ length: 10 }, (_, i) =>
    q(`X-${100 + i}`, { subject: `cs/s${i}`, status: 'unseen', answered: false, difficulty: DIFFS[i % 4] }),
  );
  const { picks } = selectQuestions({ questions, gaps: [], config: CONFIG, today: TODAY });
  const uncheckedPick = picks.find((p) => p.slot === 'unchecked');
  assert.equal(uncheckedPick.source, 'unknown');
  assert.equal(picks.length, 6);
});

test('같은 문항이 한 세션에 두 번 나오지 않는다', () => {
  const { picks } = selectQuestions({ questions: sampleQuestions(), gaps: SAMPLE_GAPS, config: CONFIG, today: TODAY });
  const ids = picks.filter((p) => p.id).map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('과목 상한을 넘기지 않는다', () => {
  const questions = Array.from({ length: 12 }, (_, i) =>
    q(`AND-${100 + i}`, { subject: 'platform/android', status: 'unseen', difficulty: '실무' }),
  );
  questions.push(q('OS-900', { difficulty: '기초', status: 'unseen' }));
  const { picks } = selectQuestions({ questions, gaps: [], config: CONFIG, today: TODAY });
  const android = picks.filter((p) => p.subject === 'platform/android').length;
  assert.ok(android <= CONFIG.max_per_subject, `한 과목이 ${android}문항으로 상한을 넘었다`);
});

test('심화 상한을 넘기지 않는다', () => {
  const questions = Array.from({ length: 10 }, (_, i) =>
    q(`X-${100 + i}`, { subject: `cs/s${i}`, status: 'unseen', difficulty: '심화' }),
  );
  questions.push(q('OS-900', { difficulty: '기초', status: 'unseen' }));
  const { picks } = selectQuestions({ questions, gaps: [], config: { ...CONFIG, difficulty_floor: { 기초: 1 } }, today: TODAY });
  assert.ok(picks.filter((p) => p.difficulty === '심화').length <= 2);
});

test('기초 하한을 반드시 채운다', () => {
  // 기초가 딱 하나뿐이고, 정렬상 뒤로 밀릴 법한 상황을 만든다.
  const questions = Array.from({ length: 10 }, (_, i) =>
    q(`X-${100 + i}`, { subject: `cs/s${i}`, status: 'unseen', difficulty: '실무' }),
  );
  questions.push(q('ZZ-999', { subject: 'cs/rare', status: 'known', streak: 2, attempts: 9, difficulty: '기초', last_asked: daysAgo(1) }));
  const { picks } = selectQuestions({ questions, gaps: [], config: CONFIG, today: TODAY });
  assert.ok(picks.some((p) => p.difficulty === '기초'), '기초 문항이 한 개도 없다');
  assert.equal(picks.length, 6, '교체 과정에서 문항 수가 바뀌면 안 된다');
});

test('쿨다운 안에 있는 문항은 피한다', () => {
  const questions = [
    q('OS-001', { status: 'wrong', attempts: 1, difficulty: '기초', last_asked: daysAgo(1) }),
    q('OS-002', { status: 'wrong', attempts: 1, difficulty: '기초', last_asked: daysAgo(30) }),
    q('NET-001', { status: 'unseen', subject: 'cs/network', difficulty: '기초' }),
    q('NET-002', { status: 'unseen', subject: 'cs/network', difficulty: '실무' }),
  ];
  const { picks } = selectQuestions({ questions, gaps: [], config: { ...CONFIG, questions_per_session: 2, mix: { wrong: 1, unknown: 1 }, difficulty_floor: {}, difficulty_cap: {} }, today: TODAY });
  const ids = picks.map((p) => p.id);
  assert.ok(ids.includes('OS-002'), '오래된 오답을 먼저 골라야 한다');
  assert.ok(!ids.includes('OS-001'), '어제 낸 문항이 또 나왔다');
});

test('후보가 모자라면 쿨다운을 무시하고서라도 문항 수를 채운다', () => {
  const questions = [
    q('OS-001', { status: 'wrong', attempts: 1, difficulty: '기초', last_asked: daysAgo(1) }),
    q('OS-002', { status: 'wrong', attempts: 1, difficulty: '실무', last_asked: daysAgo(1) }),
  ];
  const { picks } = selectQuestions({ questions, gaps: [], config: { ...CONFIG, questions_per_session: 2, mix: { wrong: 2 }, difficulty_floor: {}, difficulty_cap: {} }, today: TODAY });
  assert.equal(picks.length, 2, '쿨다운 때문에 세션이 비면 안 된다');
});

test('오답 슬롯이 비면 불안정에서 빌려온다', () => {
  const questions = [
    q('OS-001', { status: 'shaky', attempts: 1, difficulty: '기초', last_asked: daysAgo(10) }),
    q('OS-002', { status: 'unseen', difficulty: '실무' }),
  ];
  const { picks } = selectQuestions({ questions, gaps: [], config: { ...CONFIG, questions_per_session: 1, mix: { wrong: 1 }, difficulty_floor: {}, difficulty_cap: {} }, today: TODAY });
  assert.equal(picks[0].id, 'OS-001');
  assert.equal(picks[0].slot, 'wrong');
  assert.equal(picks[0].source, 'shaky');
  assert.match(picks[0].reason, /채움/, '빌려왔다는 사실이 출제 사유에 남아야 한다');
});

test('주제 대장이 비면 gap 슬롯은 미학습으로 대체된다', () => {
  const { picks } = selectQuestions({ questions: sampleQuestions(), gaps: [], config: CONFIG, today: TODAY });
  assert.equal(picks.length, 6);
  const gapPick = picks.find((p) => p.slot === 'gap');
  assert.equal(gapPick.source, 'unknown');
  assert.ok(gapPick.id, '대체된 gap 슬롯은 실제 문항이어야 한다');
});

test('gap 문항은 ID 없이 주제만 갖는다', () => {
  const { picks } = selectQuestions({ questions: sampleQuestions(), gaps: SAMPLE_GAPS, config: CONFIG, today: TODAY });
  const gapPick = picks.find((p) => p.slot === 'gap' && p.source === 'gap');
  assert.equal(gapPick.id, null);
  assert.ok(gapPick.topic);
  assert.equal(gapPick.difficulty, null, '난이도는 문제를 만들 때 Claude가 정한다');
});

test('이력이 없으면 비율을 적용하지 못했다고 알려 준다', () => {
  const questions = Array.from({ length: 10 }, (_, i) =>
    q(`X-${100 + i}`, { subject: `cs/s${i}`, status: 'unseen', difficulty: i === 0 ? '기초' : '실무' }),
  );
  const { picks, notes } = selectQuestions({ questions, gaps: [], config: CONFIG, today: TODAY });
  assert.equal(picks.length, 6, '이력이 없어도 문항 수는 채워야 한다');
  assert.ok(notes.some((n) => n.includes('채점 이력이 없어')), '보정 안내가 없다');
});

test('감쇠한 문항이 뽑히면 그 사실을 알려 준다', () => {
  const questions = [
    q('OS-001', { status: 'known', streak: 2, attempts: 3, difficulty: '기초', last_asked: daysAgo(90) }),
    q('OS-002', { status: 'unseen', difficulty: '실무' }),
  ];
  const { picks, notes } = selectQuestions({ questions, gaps: [], config: { ...CONFIG, questions_per_session: 2, mix: { wrong: 1, unknown: 1 }, difficulty_floor: {}, difficulty_cap: {} }, today: TODAY });
  assert.ok(picks.some((p) => p.id === 'OS-001'), '감쇠한 항목은 불안정이 되어 오답 슬롯으로 들어와야 한다');
  assert.ok(notes.some((n) => n.includes('불안정으로 내려온')));
});

test('과목을 지정하면 그 과목만 나온다', () => {
  const { picks } = selectQuestions({ questions: sampleQuestions(), gaps: SAMPLE_GAPS, config: CONFIG, today: TODAY, subject: 'cs/network' });
  const fromQuestions = picks.filter((p) => p.id);
  assert.ok(fromQuestions.every((p) => p.subject === 'cs/network'));
});

test('사라진 문항은 출제 대상에서 빠진다', () => {
  const questions = sampleQuestions().map((item) => (item.id === 'OS-001' ? { ...item, orphaned: true } : item));
  const { picks } = selectQuestions({ questions, gaps: SAMPLE_GAPS, config: CONFIG, today: TODAY });
  assert.ok(!picks.some((p) => p.id === 'OS-001'));
});

/* ─────────────────────────── 파싱과 보조 함수 ─────────────────────────── */

test('지식 파일에서 ID·난이도·제목·본문을 읽어 낸다', () => {
  const text = [
    '# Network',
    '',
    '## [NET-003] (기초) TCP 3단 악수를 설명해 주세요',
    '',
    '- SYN',
    '- SYN+ACK',
    '',
    '## [NET-004] (심화) QUIC은 왜 TCP를 대체하나요',
    '',
    '> (미작성)',
    '',
    '## [NET-005] 난이도를 안 적은 문항',
    '',
    '내용 있음',
  ].join('\n');
  const parsed = parseKnowledge(text, 'cs/network');

  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].id, 'NET-003');
  assert.equal(parsed[0].difficulty, '기초');
  assert.equal(parsed[0].title, 'TCP 3단 악수를 설명해 주세요');
  assert.equal(parsed[0].subject, 'cs/network');
  assert.equal(parsed[0].answered, true);

  assert.equal(parsed[1].answered, false, '(미작성)은 답이 없는 것으로 봐야 한다');
  assert.equal(parsed[2].difficulty, '실무', '난이도를 생략하면 실무로 본다');
});

test('주제 대장에서 공백과 채운 항목을 구분한다', () => {
  const text = [
    '## cs/network',
    '- [x] TCP vs UDP — NET-001',
    '- [ ] TLS 핸드셰이크',
    '- [x] HTTP 버전 — NET-010, NET-011',
    '',
    '## cs/algorithms',
    '- [ ] 퀵 정렬의 최악 조건',
  ].join('\n');
  const { gaps, covered } = parseSyllabus(text);

  assert.equal(gaps.length, 2);
  assert.deepEqual(gaps[0], { subject: 'cs/network', topic: 'TLS 핸드셰이크' });
  assert.deepEqual(gaps[1], { subject: 'cs/algorithms', topic: '퀵 정렬의 최악 조건' });

  assert.equal(covered.length, 2);
  assert.deepEqual(covered[1].ids, ['NET-010', 'NET-011'], 'ID를 여러 개 붙일 수 있어야 한다');
});

test('과목 가중치는 별표 패턴을 인식한다', () => {
  assert.equal(subjectWeight('platform/android', CONFIG), 0.4);
  assert.equal(subjectWeight('platform/compose', CONFIG), 0.4);
  assert.equal(subjectWeight('cs/network', CONFIG), 0.3);
  assert.ok(subjectWeight('cs/없는과목', CONFIG) > 0, '정의되지 않은 과목도 0이 되면 안 된다');
});

test('날짜 차이를 정확히 센다', () => {
  assert.equal(daysBetween('2026-09-01', '2026-09-02'), 1);
  assert.equal(daysBetween('2026-08-03', '2026-09-02'), 30);
  assert.equal(daysBetween(null, '2026-09-02'), Infinity, '한 번도 안 물어본 문항은 무한히 오래된 것으로');
});

test('슬롯을 못 채워도 총 문항 수는 지킨다', () => {
  // 숙지도 불안정도 없어서 known 슬롯이 자기 계통에서는 비는 상황.
  const questions = Array.from({ length: 8 }, (_, i) =>
    q(`X-${100 + i}`, { subject: `cs/s${i}`, status: 'unseen', difficulty: i === 0 ? '기초' : '실무' }),
  );
  const { picks, notes } = selectQuestions({ questions, gaps: [], config: CONFIG, today: TODAY });
  assert.equal(picks.length, 6, '슬롯이 비었다고 세션 분량이 줄면 안 된다');
  assert.ok(picks.some((p) => p.slot === 'fill'), '보충으로 채운 문항이 표시되어야 한다');
  assert.ok(notes.some((n) => n.includes('보충')), '보충했다는 사실을 알려야 한다');
});

test('출제 가능한 문항이 부족하면 그 사실을 알린다', () => {
  const questions = [q('OS-001', { status: 'unseen', difficulty: '기초' })];
  const { picks, notes } = selectQuestions({ questions, gaps: [], config: CONFIG, today: TODAY });
  assert.equal(picks.length, 1);
  assert.ok(notes.some((n) => n.includes('채우지 못했습니다')));
});

test('한 세션이 한두 과목으로 쏠리지 않는다', () => {
  // 과목 가중치가 높은 과목에 문항이 몰려 있는, 시작 직후와 같은 상황.
  const questions = [];
  for (let i = 0; i < 20; i += 1) questions.push(q(`AND-${100 + i}`, { subject: 'platform/android', status: 'unseen', answered: false, difficulty: '기초' }));
  for (let i = 0; i < 20; i += 1) questions.push(q(`CMP-${100 + i}`, { subject: 'platform/compose', status: 'unseen', answered: true, difficulty: '기초' }));
  for (let i = 0; i < 5; i += 1) questions.push(q(`OS-${100 + i}`, { subject: 'cs/os', status: 'unseen', answered: false, difficulty: '기초' }));
  for (let i = 0; i < 5; i += 1) questions.push(q(`NET-${100 + i}`, { subject: 'cs/network', status: 'unseen', answered: true, difficulty: '기초' }));

  const { picks } = selectQuestions({ questions, gaps: [], config: CONFIG, today: TODAY });
  const subjects = new Set(picks.map((p) => p.subject));
  assert.ok(subjects.size >= 3, `과목이 ${subjects.size}개뿐이다: ${[...subjects].join(', ')}`);
});

test('한 세션이 한 난이도로만 채워지지 않는다', () => {
  // 기초가 압도적으로 많고 정렬도 쉬운 것을 선호하는 상황.
  const questions = [];
  for (let i = 0; i < 20; i += 1) questions.push(q(`B-${100 + i}`, { subject: `cs/s${i % 5}`, status: 'unseen', answered: i % 2 === 0, difficulty: '기초' }));
  for (let i = 0; i < 10; i += 1) questions.push(q(`P-${100 + i}`, { subject: `cs/t${i % 5}`, status: 'unseen', answered: i % 2 === 0, difficulty: '실무' }));
  for (let i = 0; i < 5; i += 1) questions.push(q(`A-${100 + i}`, { subject: `cs/u${i}`, status: 'unseen', answered: false, difficulty: '심화' }));

  const { picks } = selectQuestions({ questions, gaps: [], config: CONFIG, today: TODAY });
  const count = (d) => picks.filter((p) => p.difficulty === d).length;
  assert.ok(count('기초') >= 1, '기초 하한 미달');
  assert.ok(count('기초') <= 3, `기초가 ${count('기초')}문항으로 상한 초과`);
  assert.ok(count('실무') >= 2, `실무가 ${count('실무')}문항으로 하한 미달`);
  assert.ok(count('심화') <= 2, '심화 상한 초과');
  assert.equal(picks.length, 6);
});

test('난이도 하한을 맞추다가 과목 상한을 깨지 않는다', () => {
  const questions = [];
  for (let i = 0; i < 10; i += 1) questions.push(q(`B-${100 + i}`, { subject: `cs/s${i}`, status: 'unseen', answered: false, difficulty: '기초' }));
  // 실무 문항이 전부 한 과목에 몰려 있다. 하한을 맞추려다 과목 상한을 넘기기 쉬운 배치.
  for (let i = 0; i < 8; i += 1) questions.push(q(`P-${100 + i}`, { subject: 'platform/android', status: 'unseen', answered: false, difficulty: '실무' }));

  const { picks } = selectQuestions({ questions, gaps: [], config: CONFIG, today: TODAY });
  const android = picks.filter((p) => p.subject === 'platform/android').length;
  assert.ok(android <= CONFIG.max_per_subject, `한 과목이 ${android}문항으로 상한을 넘었다`);
  assert.equal(picks.length, 6);
  assert.equal(new Set(picks.map((p) => p.id)).size, 6, '교체 과정에서 중복이 생기면 안 된다');
});
