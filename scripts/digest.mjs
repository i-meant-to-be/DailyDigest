#!/usr/bin/env node
/**
 * DailyDigest 운영 스크립트.
 *
 * 이 파일이 맡는 일은 "계산"이다 — 어떤 문항을 낼지 고르고, 채점 점수를 상태로 옮기고,
 * 과목별 숙련도를 집계한다. 반대로 문제를 쓰고 답을 채점하고 왜 틀렸는지 설명하는 일,
 * 즉 판단이 필요한 일은 Claude가 한다.
 *
 * 이렇게 나눈 이유는 두 가지다.
 *   1. 컨텍스트 — Claude가 mastery.json 전체를 읽지 않아도 되게 한다. 문항이 수백 개로
 *      늘어도 Claude가 보는 양은 한 세션 분량으로 일정하다.
 *   2. 정확성 — 비율, 상태 전이, 감쇠 같은 규칙은 매번 똑같이 적용되어야 한다.
 *      규칙을 코드에 두면 어긋날 일이 없고 테스트로 확인할 수 있다.
 *
 * 사용법: node scripts/digest.mjs <명령> [옵션]
 *   sync                                   지식 파일을 훑어 상태 파일과 맞춘다
 *   select [--n 6] [--subject cs/os]       출제할 문항을 고른다 (JSON 출력)
 *   pending                                채점하지 않은 세션을 찾는다
 *   open --ids NET-003,ALG-007 [--id 세션id]   세션을 만들고 출제 기록을 남긴다
 *   update --session <id> --file <채점결과.json>  상태를 갱신한다
 *   report                                 state/REPORT.md를 다시 만든다
 *   verify                                 무결성을 점검한다
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const KNOWLEDGE_DIR = join(ROOT, 'knowledge');
const SESSIONS_DIR = join(ROOT, 'sessions');
const STATE_DIR = join(ROOT, 'state');
const MASTERY_PATH = join(STATE_DIR, 'mastery.json');
const SESSIONS_PATH = join(STATE_DIR, 'sessions.json');
const REPORT_PATH = join(STATE_DIR, 'REPORT.md');
const SYLLABUS_PATH = join(KNOWLEDGE_DIR, 'SYLLABUS.md');
const CONFIG_PATH = join(ROOT, 'config', 'digest.config.json');

/** 답이 아직 없는 문항의 본문. 이 표시가 있으면 미학습으로 본다. */
export const UNANSWERED = '> (미작성)';

/** 난이도 순서. 같은 조건이면 쉬운 쪽을 먼저 낸다 — 기초에서 막히는 게 더 급하기 때문. */
const DIFFICULTY_ORDER = { 기초: 0, 실무: 1, 심화: 2 };
const DIFFICULTIES = Object.keys(DIFFICULTY_ORDER);
const STATUSES = ['unseen', 'wrong', 'shaky', 'known'];
const STATUS_LABEL = { unseen: '미학습', wrong: '오답', shaky: '불안정', known: '숙지' };

/* ────────────────────────────── 날짜 유틸 ────────────────────────────── */

/** 오늘 날짜를 YYYY-MM-DD로. 테스트에서는 today를 직접 넘겨 고정한다. */
export function todayString(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** from에서 to까지 며칠이 지났는지. 둘 다 YYYY-MM-DD 문자열. */
export function daysBetween(from, to) {
  if (!from || !to) return Infinity;
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

/* ────────────────────── 순수 로직: 감쇠와 상태 전이 ────────────────────── */

/**
 * 숙지 상태가 오래 방치되면 불안정으로 내린다.
 *
 * 한 번 맞혔다고 영원히 아는 게 아니기 때문이다. streak를 1로 남기는 이유는,
 * 다시 한 번만 제대로 답하면 숙지로 돌아올 수 있게 하기 위해서다 —
 * 처음부터 두 번 맞히라고 요구하면 복습 부담이 계속 불어난다.
 */
export function applyDecay(question, config, today) {
  if (question.status !== 'known') return question;
  const limit = config.known_decay_days ?? 60;
  if (daysBetween(question.last_asked, today) <= limit) return question;
  return { ...question, status: 'shaky', streak: 1, decayed: true };
}

/**
 * 채점 점수 하나를 상태에 반영한다.
 *
 * 핵심 규칙은 "오답에서 숙지로 한 번에 올라갈 수 없다"이다. 4점을 받으면 일단
 * 불안정으로 올라가고, 연속으로 한 번 더 4점을 받아야 숙지가 된다. 한 번 맞힌 게
 * 운인지 실력인지 구분하기 위해서다.
 *
 * score가 null이면 미응답이다. 이때는 아무것도 건드리지 않는다 — 답을 안 쓴 것을
 * 0점으로 처리하면 안 푼 문제 때문에 상태가 나빠지고, 그러면 질문지를 채우다 만
 * 날에 오답 목록이 오염된다.
 */
export function applyScore(question, score, gaps, today) {
  if (score === null || score === undefined) return question;

  const streak = score === 4 ? (question.streak ?? 0) + 1 : 0;
  let status;
  if (score <= 1) status = 'wrong';
  else if (score <= 3) status = 'shaky';
  else status = streak >= 2 ? 'known' : 'shaky';

  const history = [...(question.history ?? []), { date: today, score }];
  const next = {
    ...question,
    status,
    streak,
    attempts: (question.attempts ?? 0) + 1,
    last_graded: today,
    last_score: score,
    gaps: gaps ?? [],
    history: history.slice(-20),
  };
  delete next.decayed;
  return next;
}

/* ─────────────────────── 순수 로직: 출제 문항 선정 ─────────────────────── */

/** 과목 가중치를 찾는다. "platform/*" 처럼 별표를 쓰면 하위 경로 전체에 적용된다. */
export function subjectWeight(subject, config) {
  const table = config.subject_weight ?? {};
  if (table[subject] !== undefined) return table[subject];
  for (const [pattern, weight] of Object.entries(table)) {
    if (pattern.endsWith('/*') && subject.startsWith(pattern.slice(0, -1))) return weight;
  }
  return 0.01;
}

/**
 * 어떤 과목을 더 내야 하는지 계산한다.
 *
 * 설정한 비중보다 실제로 덜 나온 과목일수록 값이 커진다. 이걸로 정렬하면
 * 특정 과목만 계속 나오는 쏠림을 막을 수 있다.
 */
function subjectPressure(subject, questions, config) {
  const totalAttempts = questions.reduce((sum, q) => sum + (q.attempts ?? 0), 0);
  if (totalAttempts === 0) return subjectWeight(subject, config);
  const mine = questions
    .filter((q) => q.subject === subject)
    .reduce((sum, q) => sum + (q.attempts ?? 0), 0);
  return subjectWeight(subject, config) - mine / totalAttempts;
}

/**
 * 문항 풀 정의.
 *
 * `unseen`(아직 물어본 적 없음)을 둘로 쪼갠 것이 핵심이다. 성격이 전혀 다르기 때문이다.
 *   unknown   — 답이 비어 있음. 정말로 모르는 것
 *   unchecked — 답은 적어 뒀지만 한 번도 점검받지 않은 것
 * 쪼개지 않으면 수가 많은 쪽만 계속 뽑혀서 다른 쪽이 영영 안 나온다.
 */
const POOLS = {
  wrong: (q) => q.status === 'wrong',
  shaky: (q) => q.status === 'shaky',
  unknown: (q) => q.status === 'unseen' && !q.answered,
  unchecked: (q) => q.status === 'unseen' && q.answered,
  unseen: (q) => q.status === 'unseen',
  known: (q) => q.status === 'known',
};

/** 슬롯이 비었을 때 어디서 빌려올지. 앞에서부터 차례로 찾는다. */
const FALLBACK = {
  wrong: ['wrong', 'shaky', 'unchecked', 'unknown'],
  shaky: ['shaky', 'wrong', 'unchecked'],
  unknown: ['unknown', 'unchecked', 'shaky'],
  unchecked: ['unchecked', 'unknown', 'shaky'],
  unseen: ['unseen', 'wrong', 'shaky'],
  known: ['known', 'shaky', 'unchecked'],
  gap: ['gap', 'unknown', 'unchecked'],
};

const SLOT_REASON = {
  wrong: '이전 오답',
  shaky: '이전에 불완전하게 답한 문항',
  unknown: '답을 적어 둔 적 없는 문항',
  unchecked: '답은 정리했지만 아직 점검받지 않은 문항',
  unseen: '아직 물어본 적 없음',
  known: '숙지 상태 재점검',
  gap: '주제 대장 공백 (지식 파일에 아직 없는 주제)',
};

/**
 * 이번 세션에 낼 문항을 고른다.
 *
 * questions  상태가 반영된 문항 목록
 * gaps       주제 대장에서 아직 문항 ID가 붙지 않은 줄들
 * 반환값     { picks, notes } — notes는 정책을 그대로 적용하지 못한 사정을 담는다
 */
export function selectQuestions({ questions, gaps = [], config, today, subject = null }) {
  const notes = [];
  const total = config.questions_per_session ?? 6;
  const cooldown = config.cooldown_days ?? 3;
  const maxPerSubject = config.max_per_subject ?? 3;
  const caps = config.difficulty_cap ?? {};
  const floors = config.difficulty_floor ?? {};

  const live = questions
    .filter((q) => !q.orphaned)
    .filter((q) => (subject ? q.subject === subject : true))
    .map((q) => applyDecay(q, config, today));

  // 최근에 낸 문항은 일단 빼 둔다. 후보가 모자라면 아래에서 다시 꺼낸다.
  const isFresh = (q) => daysBetween(q.last_asked, today) >= cooldown;
  const rank = (q) => DIFFICULTY_ORDER[q.difficulty] ?? 1;
  const byStatus = (pool) => live.filter(POOLS[pool]);

  // 이번 세션에 이미 뽑힌 과목은 뒤로 민다.
  // 과목 상한(max_per_subject)만으로는 부족하다. 상한이 3이면 6문항이 두 과목으로도 채워지는데,
  // 특히 시작 직후처럼 이력이 없을 때는 가중치가 높은 과목이 계속 1순위라 쏠림이 심해진다.
  const spread = (q) => subjectCount.get(q.subject) ?? 0;

  // 오답·불안정은 쉬운 것부터. 기초를 못 푸는 상태를 오래 두면 안 된다.
  const byDifficulty = (a, b) => rank(a) - rank(b) || spread(a) - spread(b) || daysBetween(b.last_asked, today) - daysBetween(a.last_asked, today) || a.id.localeCompare(b.id);
  // 아직 안 물어본 것은 덜 다룬 과목부터.
  const bySubjectNeed = (a, b) => spread(a) - spread(b) || subjectPressure(b.subject, live, config) - subjectPressure(a.subject, live, config) || rank(a) - rank(b) || a.id.localeCompare(b.id);
  // 숙지는 가장 오래 안 본 것부터.
  const byStaleness = (a, b) => spread(a) - spread(b) || daysBetween(b.last_asked, today) - daysBetween(a.last_asked, today) || a.id.localeCompare(b.id);

  const comparators = {
    wrong: byDifficulty,
    shaky: byDifficulty,
    unknown: bySubjectNeed,
    unchecked: bySubjectNeed,
    unseen: bySubjectNeed,
    known: byStaleness,
  };

  const picks = [];
  const usedIds = new Set();
  const subjectCount = new Map();
  const difficultyCount = new Map();

  const canTake = (subj, difficulty) => {
    if ((subjectCount.get(subj) ?? 0) >= maxPerSubject) return false;
    if (difficulty && caps[difficulty] !== undefined && (difficultyCount.get(difficulty) ?? 0) >= caps[difficulty]) return false;
    return true;
  };

  const countIn = (pick, delta) => {
    subjectCount.set(pick.subject, (subjectCount.get(pick.subject) ?? 0) + delta);
    if (pick.difficulty) difficultyCount.set(pick.difficulty, (difficultyCount.get(pick.difficulty) ?? 0) + delta);
  };

  const record = (pick) => {
    picks.push(pick);
    if (pick.id) usedIds.add(pick.id);
    countIn(pick, 1);
  };

  // 주제 대장 공백은 덜 다룬 과목부터 꺼낸다.
  const gapQueue = [...gaps].sort(
    (a, b) => subjectPressure(b.subject, live, config) - subjectPressure(a.subject, live, config),
  );
  let gapCursor = 0;

  /** 한 슬롯을 채운다. sources를 앞에서부터 훑고, relaxOptions에 따라 쿨다운을 풀기도 한다. */
  function fillSlot(slot, sources, relaxOptions) {
    for (const relaxCooldown of relaxOptions) {
      for (const source of sources) {
        if (source === 'gap') {
          while (gapCursor < gapQueue.length) {
            const gap = gapQueue[gapCursor];
            gapCursor += 1;
            if (!canTake(gap.subject, null)) continue;
            record({
              id: null,
              topic: gap.topic,
              subject: gap.subject,
              difficulty: null,
              slot: 'gap',
              source: 'gap',
              reason: SLOT_REASON.gap,
              gaps: [],
            });
            return true;
          }
          continue;
        }
        const pool = byStatus(source)
          .filter((q) => !usedIds.has(q.id))
          .filter((q) => (relaxCooldown ? true : isFresh(q)))
          .filter((q) => canTake(q.subject, q.difficulty))
          .sort(comparators[source]);
        if (pool.length === 0) continue;
        const q = pool[0];
        const borrowed = source !== slot;
        record({
          id: q.id,
          topic: q.title,
          subject: q.subject,
          difficulty: q.difficulty,
          slot,
          source,
          reason: borrowed ? `${SLOT_REASON[slot]} 슬롯을 ${SLOT_REASON[source]}(으)로 채움` : SLOT_REASON[slot],
          last_asked: q.last_asked ?? null,
          gaps: q.gaps ?? [],
          decayed: q.decayed ?? false,
        });
        return true;
      }
    }
    return false;
  }

  const mix = config.mix ?? { wrong: 2, unseen: 2, known: 1, gap: 1 };
  const plan = [];
  for (const [slot, count] of Object.entries(mix)) {
    for (let i = 0; i < count; i += 1) plan.push(slot);
  }
  // 설정한 슬롯 합이 총 문항 수와 다르면 총 문항 수를 따른다.
  while (plan.length < total) plan.push('unseen');
  plan.length = Math.min(plan.length, total);

  // 두 번에 나눠 채운다.
  //   1차 — 각 슬롯이 자기 풀에서만 가져간다
  //   2차 — 1차에서 못 채운 슬롯만 대체 순서를 따라 다른 풀에서 빌려온다
  // 한 번에 처리하면 앞 순서의 슬롯이 대체 후보로 남의 풀을 먼저 비워, 정작 그 풀을
  // 전담하는 슬롯이 빈손이 된다. 재고가 적은 풀일수록 이 문제가 심해진다.
  const pending = [];
  for (const slot of plan) {
    if (!fillSlot(slot, [FALLBACK[slot][0]], [false])) pending.push(slot);
  }
  for (const slot of pending) {
    if (!fillSlot(slot, FALLBACK[slot], [false, true])) {
      notes.push(`${SLOT_REASON[slot]} 슬롯을 채울 후보가 없었습니다.`);
    }
  }

  // 슬롯 규칙으로 다 못 채웠으면 남은 문항으로 개수를 맞춘다.
  // 세션 분량이 날마다 들쭉날쭉하면 학습 리듬이 깨지므로, 비율은 못 지켜도 개수는 지킨다.
  if (picks.length < total) {
    const before = picks.length;
    for (const relaxCooldown of [false, true]) {
      for (const source of ['unchecked', 'unknown', 'shaky', 'wrong', 'known']) {
        while (picks.length < total) {
          const candidate = byStatus(source)
            .filter((q) => !usedIds.has(q.id))
            .filter((q) => (relaxCooldown ? true : isFresh(q)))
            .filter((q) => canTake(q.subject, q.difficulty))
            .sort(comparators[source])[0];
          if (!candidate) break;
          record({
            id: candidate.id,
            topic: candidate.title,
            subject: candidate.subject,
            difficulty: candidate.difficulty,
            slot: 'fill',
            source,
            reason: `문항 수를 맞추기 위한 보충 (${SLOT_REASON[source]})`,
            last_asked: candidate.last_asked ?? null,
            gaps: candidate.gaps ?? [],
            decayed: candidate.decayed ?? false,
          });
        }
      }
    }
    if (picks.length > before) {
      notes.push(`슬롯 규칙으로 ${before}문항만 채워져 ${picks.length - before}문항을 다른 상태에서 보충했습니다.`);
    }
    if (picks.length < total) {
      notes.push(`출제 가능한 문항이 ${picks.length}개뿐이라 ${total}문항을 채우지 못했습니다.`);
    }
  }

  // 난이도 하한을 못 채웠으면, 뒤에서부터 다른 문항을 밀어내고 채워 넣는다.
  for (const [difficulty, floor] of Object.entries(floors)) {
    let have = picks.filter((p) => p.difficulty === difficulty).length;
    while (have < floor) {
      // 밀어낼 문항을 먼저 정하고 그 몫을 돌려놓아야, 교체 후보가 과목·난이도 상한을
      // 넘지 않는지 정확히 판단할 수 있다.
      let victimIndex = -1;
      for (let i = picks.length - 1; i >= 0; i -= 1) {
        const p = picks[i];
        if (p.difficulty === difficulty) continue;
        // 다른 난이도의 하한을 이미 아슬아슬하게 채운 문항은 건드리지 않는다.
        const otherFloor = floors[p.difficulty] ?? 0;
        if (otherFloor > 0 && picks.filter((x) => x.difficulty === p.difficulty).length <= otherFloor) continue;
        victimIndex = i;
        break;
      }
      if (victimIndex === -1) break;

      const victim = picks[victimIndex];
      if (victim.id) usedIds.delete(victim.id);
      countIn(victim, -1);

      const candidate = live
        .filter((q) => q.difficulty === difficulty && !usedIds.has(q.id))
        .filter((q) => canTake(q.subject, q.difficulty))
        .sort((a, b) => {
          const order = { wrong: 0, shaky: 1, unseen: 2, known: 3 };
          return (order[a.status] ?? 4) - (order[b.status] ?? 4) || spread(a) - spread(b) || a.id.localeCompare(b.id);
        })[0];

      if (!candidate) {
        // 되돌린다. 교체할 수 없으면 원래 문항을 그대로 둔다.
        if (victim.id) usedIds.add(victim.id);
        countIn(victim, 1);
        notes.push(`난이도 하한(${difficulty} ${floor}문항)을 채울 문항을 찾지 못했습니다.`);
        break;
      }

      const replacement = {
        id: candidate.id,
        topic: candidate.title,
        subject: candidate.subject,
        difficulty: candidate.difficulty,
        slot: victim.slot,
        source: candidate.status,
        reason: `${SLOT_REASON[victim.slot]} — 난이도 하한을 맞추려 ${difficulty} 문항으로 교체`,
        last_asked: candidate.last_asked ?? null,
        gaps: candidate.gaps ?? [],
        decayed: candidate.decayed ?? false,
      };
      picks[victimIndex] = replacement;
      usedIds.add(candidate.id);
      countIn(replacement, 1);
      have += 1;
    }
  }

  // 시작 직후에는 오답도 숙지도 없다. 비율을 못 지킨 게 고장이 아니라는 걸 알려 준다.
  const hasHistory = live.some((q) => (q.attempts ?? 0) > 0);
  if (!hasHistory) {
    notes.push('아직 채점 이력이 없어 오답·숙지 슬롯을 적용하지 못했습니다. 3~4세션이면 설정한 비율로 수렴합니다.');
  }
  const decayedCount = picks.filter((p) => p.decayed).length;
  if (decayedCount > 0) {
    notes.push(`${decayedCount}문항은 오래 점검하지 않아 숙지에서 불안정으로 내려온 항목입니다.`);
  }

  return { picks, notes };
}

/* ──────────────────────── 파일 읽기: 지식과 주제 대장 ──────────────────────── */

/** knowledge/ 아래 모든 마크다운 파일 경로를 모은다. */
function knowledgeFiles(dir = KNOWLEDGE_DIR, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) knowledgeFiles(path, acc);
    else if (entry.name.endsWith('.md') && !['README.md', 'SYLLABUS.md'].includes(entry.name)) acc.push(path);
  }
  return acc;
}

/**
 * 지식 파일 하나를 문항 목록으로 바꾼다.
 *
 * 문항 제목 형식: `## [NET-003] (기초) TCP 3단 악수를 설명해 주세요`
 * 난이도는 생략할 수 있고, 그때는 실무로 본다.
 */
export function parseKnowledge(text, subject) {
  const questions = [];
  const lines = text.split(/\r?\n/);
  const header = /^##\s+\[([A-Z]+-\d+)\]\s*(?:\((기초|실무|심화)\))?\s*(.*)$/;
  let current = null;
  for (const line of lines) {
    const match = header.exec(line);
    if (match) {
      if (current) questions.push(current);
      current = {
        id: match[1],
        difficulty: match[2] ?? '실무',
        title: match[3].trim(),
        subject,
        body: [],
      };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) questions.push(current);
  return questions.map((q) => {
    const body = q.body.join('\n').trim();
    return { ...q, body, answered: body.length > 0 && !body.startsWith(UNANSWERED) };
  });
}

/** 지식 파일 전체를 읽어 문항 목록으로 만든다. */
export function loadKnowledge() {
  const out = [];
  for (const path of knowledgeFiles()) {
    const subject = path
      .slice(KNOWLEDGE_DIR.length + 1)
      .replace(/\\/g, '/')
      .replace(/\.md$/, '');
    out.push(...parseKnowledge(readFileSync(path, 'utf8'), subject));
  }
  return out;
}

/**
 * 주제 대장을 읽는다.
 *
 * `## cs/network` 아래의 `- [ ] 주제` 줄 중 문항 ID가 붙지 않은 것이 커버리지 공백이다.
 * 이 공백이 gap 슬롯의 재고가 된다 — 지식 파일에 존재조차 하지 않는 주제를 꺼내는 통로.
 */
export function parseSyllabus(text) {
  const gaps = [];
  const covered = [];
  let subject = null;
  for (const raw of text.split(/\r?\n/)) {
    const heading = /^##\s+(\S+)/.exec(raw);
    if (heading) {
      subject = heading[1];
      continue;
    }
    const item = /^\s*-\s+\[([ xX])\]\s*(.+)$/.exec(raw);
    if (!item || !subject) continue;
    const idMatch = /—\s*([A-Z]+-\d+(?:\s*,\s*[A-Z]+-\d+)*)\s*$/.exec(item[2]);
    const topic = item[2].replace(/—\s*[A-Z]+-\d+.*$/, '').trim();
    if (idMatch) covered.push({ subject, topic, ids: idMatch[1].split(/\s*,\s*/) });
    else gaps.push({ subject, topic });
  }
  return { gaps, covered };
}

function loadSyllabus() {
  if (!existsSync(SYLLABUS_PATH)) return { gaps: [], covered: [] };
  return parseSyllabus(readFileSync(SYLLABUS_PATH, 'utf8'));
}

/* ─────────────────────────── 상태 파일 읽고 쓰기 ─────────────────────────── */

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function loadConfig() {
  const raw = readJson(CONFIG_PATH, {});
  // "_"로 시작하는 키는 설정 파일 안에 적어 둔 설명이라 계산에서 제외한다.
  return Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith('_')));
}

function loadMastery() {
  return readJson(MASTERY_PATH, { version: 1, updated_at: null, questions: {} });
}

function saveMastery(mastery, today) {
  writeJson(MASTERY_PATH, { ...mastery, updated_at: today });
}

function loadSessions() {
  return readJson(SESSIONS_PATH, { pending: null, sessions: [] });
}

/** 상태 기록을 문항 배열로 편다. 선정 로직은 배열만 다룬다. */
function toArray(mastery) {
  return Object.entries(mastery.questions).map(([id, value]) => ({ id, ...value }));
}

/* ──────────────────────────────── 명령 ──────────────────────────────── */

/**
 * sync — 지식 파일과 상태 파일을 맞춘다.
 *
 * 새 문항은 미학습으로 등록하고, 지식 파일에서 사라진 문항은 지우지 않고 표시만 한다.
 * 지우지 않는 이유는 실수로 문항을 옮겼을 때 이력까지 날아가면 복구할 수 없기 때문이다.
 */
function commandSync(today) {
  const mastery = loadMastery();
  const knowledge = loadKnowledge();
  const seen = new Set();
  const added = [];
  const changed = [];
  const duplicates = [];

  for (const q of knowledge) {
    if (seen.has(q.id)) {
      duplicates.push(q.id);
      continue;
    }
    seen.add(q.id);
    const existing = mastery.questions[q.id];
    if (!existing) {
      mastery.questions[q.id] = {
        subject: q.subject,
        difficulty: q.difficulty,
        title: q.title,
        answered: q.answered,
        status: 'unseen',
        attempts: 0,
        streak: 0,
        last_asked: null,
        last_graded: null,
        last_score: null,
        gaps: [],
        history: [],
      };
      added.push(q.id);
      continue;
    }
    // 지식 파일이 원본이므로 과목·난이도·제목·답변 유무는 늘 그쪽을 따른다.
    const snapshot = () => JSON.stringify([existing.subject, existing.difficulty, existing.title, existing.answered, existing.orphaned]);
    const before = snapshot();
    existing.subject = q.subject;
    existing.difficulty = q.difficulty;
    existing.title = q.title;
    existing.answered = q.answered;
    if (existing.orphaned) delete existing.orphaned;
    if (snapshot() !== before) changed.push(q.id);
  }

  const orphaned = [];
  for (const id of Object.keys(mastery.questions)) {
    if (seen.has(id)) continue;
    mastery.questions[id].orphaned = true;
    orphaned.push(id);
  }

  saveMastery(mastery, today);
  const lines = [
    `문항 ${seen.size}개 확인`,
    `새로 등록 ${added.length}개${added.length ? `: ${added.join(', ')}` : ''}`,
    `메타 갱신 ${changed.length}개`,
  ];
  if (duplicates.length) lines.push(`⚠ ID 중복 ${duplicates.length}개: ${duplicates.join(', ')}`);
  if (orphaned.length) lines.push(`⚠ 지식 파일에서 사라진 문항 ${orphaned.length}개(삭제하지 않고 표시만 함): ${orphaned.join(', ')}`);
  console.log(lines.join('\n'));
}

/** select — 이번에 낼 문항을 고른다. Claude는 이 출력만 읽으면 된다. */
function commandSelect(args, today) {
  const config = loadConfig();
  if (args.n) config.questions_per_session = Number(args.n);
  const mastery = loadMastery();
  const { gaps } = loadSyllabus();
  const result = selectQuestions({
    questions: toArray(mastery),
    gaps,
    config,
    today,
    subject: args.subject ?? null,
  });
  console.log(JSON.stringify(result, null, 2));
}

/**
 * pending — 채점하지 않은 세션을 찾는다.
 *
 * 세션 목록을 훑거나 질문지 본문을 열지 않는다. 인덱스 파일 한 개만 읽고,
 * 그게 없거나 어긋나면 디렉터리 이름의 접미사만 본다. 세션이 수백 개로 쌓여도
 * 읽는 양이 늘지 않게 하려는 설계다.
 */
function commandPending() {
  const index = loadSessions();
  if (index.pending) {
    const dir = join(SESSIONS_DIR, `${index.pending}.pending`);
    if (existsSync(dir)) {
      console.log(JSON.stringify({ pending: index.pending, path: dir, source: 'index' }, null, 2));
      return;
    }
  }
  // 인덱스가 어긋났을 때만 디렉터리 이름을 본다. 파일 내용은 여전히 읽지 않는다.
  if (!existsSync(SESSIONS_DIR)) {
    console.log(JSON.stringify({ pending: null }, null, 2));
    return;
  }
  const found = readdirSync(SESSIONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.endsWith('.pending'))
    .map((e) => e.name.replace(/\.pending$/, ''))
    .sort()
    .reverse();
  if (found.length === 0) {
    console.log(JSON.stringify({ pending: null }, null, 2));
    return;
  }
  console.log(JSON.stringify({
    pending: found[0],
    path: join(SESSIONS_DIR, `${found[0]}.pending`),
    source: 'directory',
    others: found.slice(1),
  }, null, 2));
}

/**
 * open — 세션을 만들고 출제 사실을 기록한다.
 *
 * 여기서 last_asked를 찍는다. 채점 때가 아니라 출제 때 찍는 이유는, 쿨다운이
 * "언제 물어봤는가"를 기준으로 동작해야 하기 때문이다. 답을 안 쓰고 넘어간 문항도
 * 이미 한 번 눈에 띄었으니 바로 다음 세션에 또 나오면 곤란하다.
 */
function commandOpen(args, today) {
  const id = args.id ?? `${today}-${String(new Date().getHours()).padStart(2, '0')}${String(new Date().getMinutes()).padStart(2, '0')}`;
  const dir = join(SESSIONS_DIR, `${id}.pending`);
  mkdirSync(dir, { recursive: true });

  const ids = (args.ids ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const mastery = loadMastery();
  for (const qid of ids) {
    if (mastery.questions[qid]) mastery.questions[qid].last_asked = today;
  }
  saveMastery(mastery, today);

  const index = loadSessions();
  index.sessions = index.sessions.filter((s) => s.id !== id);
  index.sessions.push({ id, status: 'pending', opened: today, ids, count: Number(args.count ?? ids.length) });
  index.pending = id;
  writeJson(SESSIONS_PATH, index);

  console.log(JSON.stringify({ id, path: dir, quiz: join(dir, 'quiz.md') }, null, 2));
}

/**
 * update — 채점 결과를 상태에 반영한다.
 *
 * 입력 파일 형식: [{ "id": "NET-003", "score": 2, "gaps": ["..."] }, ...]
 * score를 null로 두면 미응답이고, 그 문항의 상태는 손대지 않는다.
 * gap 슬롯에서 새로 만든 문항은 sync가 먼저 등록해야 하므로 여기서는 건너뛴다.
 */
function commandUpdate(args, today) {
  if (!args.file) throw new Error('--file <채점결과.json> 이 필요합니다.');
  const scores = JSON.parse(readFileSync(args.file, 'utf8'));
  const mastery = loadMastery();
  const config = loadConfig();
  const lines = [];

  for (const entry of scores) {
    const question = mastery.questions[entry.id];
    if (!question) {
      lines.push(`⚠ ${entry.id}: 상태 파일에 없는 문항입니다. sync를 먼저 실행하세요.`);
      continue;
    }
    if (entry.score === null || entry.score === undefined) {
      lines.push(`${entry.id}: 미응답 — 상태를 바꾸지 않았습니다.`);
      continue;
    }
    const before = applyDecay({ id: entry.id, ...question }, config, today);
    const after = applyScore(before, entry.score, entry.gaps, today);
    delete after.id;
    mastery.questions[entry.id] = after;
    const moved = before.status === after.status ? after.status : `${before.status} → ${after.status}`;
    lines.push(`${entry.id}: ${entry.score}점 · ${STATUS_LABEL[after.status] ?? after.status} (${moved}) · 연속 만점 ${after.streak}`);
  }

  saveMastery(mastery, today);

  const session = args.session ?? loadSessions().pending;
  if (session) {
    const index = loadSessions();
    const row = index.sessions.find((s) => s.id === session);
    if (row) {
      row.status = 'graded';
      row.graded = today;
      const graded = scores.filter((s) => s.score !== null && s.score !== undefined);
      row.average = graded.length ? Number((graded.reduce((a, b) => a + b.score, 0) / graded.length).toFixed(2)) : null;
    }
    if (index.pending === session) index.pending = null;
    writeJson(SESSIONS_PATH, index);

    const from = join(SESSIONS_DIR, `${session}.pending`);
    const to = join(SESSIONS_DIR, `${session}.graded`);
    if (existsSync(from) && !existsSync(to)) {
      // 디렉터리 이름의 접미사도 함께 바꿔 인덱스가 깨져도 상태를 알 수 있게 한다.
      renameSync(from, to);
      lines.push(`세션 디렉터리를 ${session}.graded 로 옮겼습니다.`);
    }
  }

  console.log(lines.join('\n'));
}

/* ──────────────────────────────── 리포트 ──────────────────────────────── */

/** report — 과목별·난이도별 숙련도를 집계해 사람이 읽을 문서로 만든다. */
function commandReport(today) {
  const config = loadConfig();
  const mastery = loadMastery();
  const { gaps, covered } = loadSyllabus();
  const questions = toArray(mastery)
    .filter((q) => !q.orphaned)
    .map((q) => applyDecay(q, config, today));
  const sessions = loadSessions().sessions ?? [];

  const bucket = (list) => {
    const out = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    for (const q of list) out[q.status] = (out[q.status] ?? 0) + 1;
    return out;
  };

  // 숙련도 점수: 숙지 1점, 불안정 0.5점, 나머지 0점. 한 눈에 비교하려는 용도다.
  const mastery_score = (list) => {
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, q) => acc + (q.status === 'known' ? 1 : q.status === 'shaky' ? 0.5 : 0), 0);
    return Math.round((sum / list.length) * 100);
  };

  const subjects = [...new Set(questions.map((q) => q.subject))].sort();
  const lines = [];
  lines.push('# 숙련도 리포트');
  lines.push('');
  lines.push(`갱신: ${today} · 이 문서는 \`node scripts/digest.mjs report\`가 생성합니다. 직접 고치지 마세요.`);
  lines.push('');

  const all = bucket(questions);
  const unknown = questions.filter(POOLS.unknown).length;
  const unchecked = questions.filter(POOLS.unchecked).length;
  lines.push(`전체 ${questions.length}문항 · 숙지 ${all.known} · 불안정 ${all.shaky} · 오답 ${all.wrong} · 미학습 ${all.unseen} · 숙련도 ${mastery_score(questions)}%`);
  lines.push('');
  lines.push(`미학습 ${all.unseen}문항의 내역 — 답이 비어 있는 문항 ${unknown}개, 답은 정리했으나 점검받지 않은 문항 ${unchecked}개`);
  lines.push('');

  lines.push('## 과목별');
  lines.push('');
  lines.push('| 과목 | 문항 | 숙지 | 불안정 | 오답 | 미학습 | 숙련도 |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const subject of subjects) {
    const list = questions.filter((q) => q.subject === subject);
    const b = bucket(list);
    lines.push(`| ${subject} | ${list.length} | ${b.known} | ${b.shaky} | ${b.wrong} | ${b.unseen} | ${mastery_score(list)}% |`);
  }
  lines.push('');

  lines.push('## 난이도별');
  lines.push('');
  lines.push('| 난이도 | 문항 | 숙지 | 불안정 | 오답 | 미학습 | 숙련도 |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const difficulty of DIFFICULTIES) {
    const list = questions.filter((q) => q.difficulty === difficulty);
    if (list.length === 0) continue;
    const b = bucket(list);
    lines.push(`| ${difficulty} | ${list.length} | ${b.known} | ${b.shaky} | ${b.wrong} | ${b.unseen} | ${mastery_score(list)}% |`);
  }
  lines.push('');

  const wrong = questions.filter((q) => q.status === 'wrong').sort((a, b) => a.subject.localeCompare(b.subject) || a.id.localeCompare(b.id));
  lines.push(`## 오답 (${wrong.length})`);
  lines.push('');
  if (wrong.length === 0) lines.push('없습니다.');
  for (const q of wrong) {
    lines.push(`- **${q.id}** (${q.subject} · ${q.difficulty}) ${q.title ?? ''}`);
    for (const gap of q.gaps ?? []) lines.push(`  - 지적: ${gap}`);
  }
  lines.push('');

  const stale = questions
    .filter((q) => q.decayed)
    .sort((a, b) => daysBetween(b.last_asked, today) - daysBetween(a.last_asked, today));
  lines.push(`## 오래 점검하지 않은 숙지 항목 (${stale.length})`);
  lines.push('');
  if (stale.length === 0) lines.push('없습니다.');
  for (const q of stale) {
    lines.push(`- **${q.id}** (${q.subject}) — ${daysBetween(q.last_asked, today)}일 경과`);
  }
  lines.push('');

  lines.push('## 주제 대장 커버리지');
  lines.push('');
  const syllabusSubjects = [...new Set([...gaps, ...covered].map((g) => g.subject))].sort();
  if (syllabusSubjects.length === 0) {
    lines.push('주제 대장이 아직 비어 있습니다.');
  } else {
    lines.push('| 과목 | 채움 | 전체 | 남은 공백 |');
    lines.push('| --- | ---: | ---: | ---: |');
    for (const subject of syllabusSubjects) {
      const c = covered.filter((g) => g.subject === subject).length;
      const g = gaps.filter((x) => x.subject === subject).length;
      lines.push(`| ${subject} | ${c} | ${c + g} | ${g} |`);
    }
  }
  lines.push('');

  const recent = sessions.filter((s) => s.status === 'graded').slice(-5).reverse();
  lines.push('## 최근 세션');
  lines.push('');
  if (recent.length === 0) lines.push('채점된 세션이 아직 없습니다.');
  else {
    lines.push('| 세션 | 문항 | 평균 |');
    lines.push('| --- | ---: | ---: |');
    for (const s of recent) lines.push(`| ${s.id} | ${s.count ?? '-'} | ${s.average ?? '-'} |`);
  }
  lines.push('');

  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, `${lines.join('\n')}\n`, 'utf8');
  console.log(`state/REPORT.md 갱신 — 전체 ${questions.length}문항, 숙련도 ${mastery_score(questions)}%`);
}

/** verify — 무결성 점검. 문제가 있으면 종료 코드 1로 알린다. */
function commandVerify(today) {
  const problems = [];
  const knowledge = loadKnowledge();
  const mastery = loadMastery();

  const seen = new Map();
  for (const q of knowledge) {
    if (seen.has(q.id)) problems.push(`ID 중복: ${q.id} (${seen.get(q.id)} / ${q.subject})`);
    else seen.set(q.id, q.subject);
    if (!DIFFICULTIES.includes(q.difficulty)) problems.push(`난이도 값이 이상함: ${q.id} = ${q.difficulty}`);
  }

  for (const id of seen.keys()) {
    if (!mastery.questions[id]) problems.push(`상태 파일에 없는 문항: ${id} — sync를 실행하세요.`);
  }
  for (const [id, q] of Object.entries(mastery.questions)) {
    if (!seen.has(id) && !q.orphaned) problems.push(`지식 파일에 없는데 표시도 안 된 문항: ${id}`);
    if (q.status && !STATUSES.includes(q.status)) problems.push(`상태 값이 이상함: ${id} = ${q.status}`);
  }

  const index = loadSessions();
  if (existsSync(SESSIONS_DIR)) {
    const dirs = readdirSync(SESSIONS_DIR, { withFileTypes: true }).filter((e) => e.isDirectory());
    for (const dir of dirs) {
      if (!/\.(pending|graded)$/.test(dir.name)) problems.push(`세션 디렉터리 이름에 상태 접미사가 없음: ${dir.name}`);
    }
    const pendingDirs = dirs.filter((d) => d.name.endsWith('.pending')).map((d) => d.name.replace(/\.pending$/, ''));
    if (index.pending && !pendingDirs.includes(index.pending)) {
      problems.push(`인덱스는 ${index.pending}이 미채점이라는데 그런 디렉터리가 없습니다.`);
    }
    if (!index.pending && pendingDirs.length > 0) {
      problems.push(`인덱스에는 미채점이 없다는데 디렉터리는 남아 있습니다: ${pendingDirs.join(', ')}`);
    }
  }

  if (problems.length === 0) {
    console.log(`이상 없음 — 문항 ${seen.size}개, 상태 기록 ${Object.keys(mastery.questions).length}개 (${today})`);
    return;
  }
  console.log(`문제 ${problems.length}건:`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exitCode = 1;
}

/* ──────────────────────────────── 진입점 ──────────────────────────────── */

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) args[key] = true;
    else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const today = args.today ?? todayString();

  switch (command) {
    case 'sync': return commandSync(today);
    case 'select': return commandSelect(args, today);
    case 'pending': return commandPending();
    case 'open': return commandOpen(args, today);
    case 'update': return commandUpdate(args, today);
    case 'report': return commandReport(today);
    case 'verify': return commandVerify(today);
    default:
      console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].split('\n').slice(1).map((l) => l.replace(/^ \* ?/, '')).join('\n'));
      process.exitCode = command ? 1 : 0;
  }
}

// 테스트에서 import할 때는 실행하지 않는다.
if (process.argv[1] && process.argv[1].endsWith('digest.mjs')) {
  main().catch((error) => {
    console.error(`오류: ${error.message}`);
    process.exitCode = 1;
  });
}
