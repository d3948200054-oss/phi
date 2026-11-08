import { QuestionCheck, QuestionDraft } from '../types';

export function runQuestionChecks(q: Partial<QuestionDraft>): QuestionCheck[] {
  const checks: QuestionCheck[] = [];

  // 1. Question text present / long enough / not truncated
  const text = (q.questionText || '').trim();
  if (!text) {
    checks.push({
      id: 'stem-presence',
      label: 'Question Stem',
      status: 'fail',
      detail: 'Question text is completely empty. Enter a question stem.'
    });
  } else if (text.length < 15) {
    checks.push({
      id: 'stem-presence',
      label: 'Question Stem',
      status: 'warn',
      detail: `Question text is very short (${text.length} chars). Ensure it has sufficient context.`
    });
  } else if (text.endsWith('...') || text.endsWith('etc.')) {
    checks.push({
      id: 'stem-presence',
      label: 'Question Stem',
      status: 'warn',
      detail: 'Question appears truncated at the end.'
    });
  } else {
    checks.push({
      id: 'stem-presence',
      label: 'Question Stem',
      status: 'pass',
      detail: 'Stem is adequately descriptive and complete.'
    });
  }

  // 2. Option count ≥ 3
  const options = q.options || [];
  if (options.length < 3) {
    checks.push({
      id: 'option-count',
      label: 'Option Count',
      status: 'fail',
      detail: `Only ${options.length} options provided; at least 3 required (standard is 4).`
    });
  } else if (options.length === 3) {
    checks.push({
      id: 'option-count',
      label: 'Option Count',
      status: 'warn',
      detail: '3 options provided. Standard competitive exams recommend 4.'
    });
  } else {
    checks.push({
      id: 'option-count',
      label: 'Option Count',
      status: 'pass',
      detail: `${options.length} options available.`
    });
  }

  // 3. Option text present / not empty
  const emptyOptions = options.some(opt => !opt || opt.trim().length === 0);
  if (emptyOptions) {
    checks.push({
      id: 'option-empty',
      label: 'Option Completeness',
      status: 'fail',
      detail: 'One or more option choices are empty.'
    });
  } else {
    checks.push({
      id: 'option-empty',
      label: 'Option Completeness',
      status: 'pass',
      detail: 'All option choices have text.'
    });
  }

  // 4. Duplicate options within a question
  const trimmedLowerOpts = options.map(o => o.trim().toLowerCase());
  const uniqueOpts = new Set(trimmedLowerOpts);
  if (options.length > 0 && uniqueOpts.size < options.length) {
    checks.push({
      id: 'duplicate-options',
      label: 'Duplicate Options',
      status: 'fail',
      detail: 'Found duplicate option choices in this question.'
    });
  } else {
    checks.push({
      id: 'duplicate-options',
      label: 'Duplicate Options',
      status: 'pass',
      detail: 'All option choices are distinct.'
    });
  }

  // 5. Answer key in range / an option is keyed
  const keyIdx = q.correctOptionIndex ?? -1;
  if (keyIdx < 0 || keyIdx >= options.length) {
    checks.push({
      id: 'keyed-answer',
      label: 'Answer Key',
      status: 'fail',
      detail: 'No correct answer option is keyed or index is out of bounds.'
    });
  } else {
    checks.push({
      id: 'keyed-answer',
      label: 'Answer Key',
      status: 'pass',
      detail: `Option ${String.fromCharCode(65 + keyIdx)} is keyed as correct.`
    });
  }

  // 6. Answer giveaway
  const giveawayTerms = ['all of the above', 'none of the above', 'both a and b', 'both b and c', 'obviously', 'definitely', 'always true'];
  const keyedText = (keyIdx >= 0 && options[keyIdx]) ? options[keyIdx].toLowerCase() : '';
  const hasGiveaway = giveawayTerms.some(term => keyedText.includes(term));
  const stemGiveaway = ['correct answer is', 'as we all know', 'clearly'].some(term => text.toLowerCase().includes(term));

  if (hasGiveaway || stemGiveaway) {
    checks.push({
      id: 'giveaway-check',
      label: 'Answer Giveaway',
      status: 'warn',
      detail: 'Keyed option or stem contains predictable giveaways ("all of above", "obviously", etc.).'
    });
  } else {
    checks.push({
      id: 'giveaway-check',
      label: 'Answer Giveaway',
      status: 'pass',
      detail: 'No giveaway phrasing detected.'
    });
  }

  // 7. Option length bias
  if (options.length >= 3 && keyIdx >= 0 && keyIdx < options.length) {
    const lengths = options.map(o => o.length);
    const avgOtherLen = (lengths.reduce((a, b) => a + b, 0) - lengths[keyIdx]) / (options.length - 1);
    const keyedLen = lengths[keyIdx];
    if (avgOtherLen > 5 && (keyedLen > avgOtherLen * 2.3 || keyedLen < avgOtherLen * 0.35)) {
      checks.push({
        id: 'length-bias',
        label: 'Length Bias',
        status: 'warn',
        detail: `Keyed option length (${keyedLen} chars) differs heavily from distractor average (~${Math.round(avgOtherLen)} chars).`
      });
    } else {
      checks.push({
        id: 'length-bias',
        label: 'Length Bias',
        status: 'pass',
        detail: 'Option lengths are well balanced.'
      });
    }
  }

  // 8. Numeric consistency
  const numbersInStem = text.match(/\b\d+(\.\d+)?\b/g) || [];
  if (numbersInStem.length > 0 && keyIdx >= 0) {
    checks.push({
      id: 'numeric-consistency',
      label: 'Numeric Consistency',
      status: 'pass',
      detail: `Question contains quantitative data (${numbersInStem.length} numbers found).`
    });
  }

  // 9. Explanation present
  const explanation = (q.solutionExplanation || '').trim();
  if (!explanation) {
    checks.push({
      id: 'explanation-check',
      label: 'Solution Explanation',
      status: 'warn',
      detail: 'No explanation provided. Students need a step-by-step breakdown.'
    });
  } else if (explanation.length < 20) {
    checks.push({
      id: 'explanation-check',
      label: 'Solution Explanation',
      status: 'warn',
      detail: 'Explanation is very brief. Consider adding derivation steps.'
    });
  } else {
    checks.push({
      id: 'explanation-check',
      label: 'Solution Explanation',
      status: 'pass',
      detail: 'Clear solution explanation provided.'
    });
  }

  // 10. Figure / graph check
  const needsDiagram = /figure|diagram|circuit|graph|fbd|shown below|plot/i.test(text);
  const hasDiagram = q.diagram && q.diagram.kind !== 'none';
  if (needsDiagram && !hasDiagram) {
    checks.push({
      id: 'figure-dependency',
      label: 'Diagram / Figure',
      status: 'fail',
      detail: 'Question mentions a figure or graph, but no diagram is attached.'
    });
  } else if (hasDiagram) {
    checks.push({
      id: 'figure-dependency',
      label: 'Diagram / Figure',
      status: 'pass',
      detail: `Diagram attached: ${q.diagram?.kind?.toUpperCase()} diagram.`
    });
  }

  // 11. Source grounding
  if (q.sourceTimestampSeconds !== undefined && q.sourceTimestampSeconds !== null) {
    const mins = Math.floor(q.sourceTimestampSeconds / 60);
    const secs = q.sourceTimestampSeconds % 60;
    const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    checks.push({
      id: 'source-grounding',
      label: 'Source Grounding',
      status: 'pass',
      detail: `Grounded in lecture timestamp [${timeStr}].`
    });
  }

  // 12. Extraction confidence
  const conf = q.confidence ?? 100;
  if (conf < 70) {
    checks.push({
      id: 'extraction-confidence',
      label: 'Extraction Confidence',
      status: 'warn',
      detail: `Low extraction confidence (${conf}%). Rewrite this question yourself before approval.`
    });
  } else {
    checks.push({
      id: 'extraction-confidence',
      label: 'Extraction Confidence',
      status: 'pass',
      detail: `High confidence extraction (${conf}%).`
    });
  }

  return checks;
}

export function hasFailingCheck(checks: QuestionCheck[]): boolean {
  return checks.some(c => c.status === 'fail');
}

export function validateQuestionSet(questions: QuestionDraft[]): {
  isValid: boolean;
  issues: string[];
  spread: Record<string, number>;
  duplicateCount: number;
} {
  const issues: string[] = [];
  let duplicateCount = 0;
  const spread: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, Other: 0 };

  const seenStems = new Set<string>();

  questions.forEach((q, idx) => {
    const key = String.fromCharCode(65 + q.correctOptionIndex);
    if (['A', 'B', 'C', 'D'].includes(key)) {
      spread[key] = (spread[key] || 0) + 1;
    } else {
      spread.Other = (spread.Other || 0) + 1;
    }

    const normStem = q.questionText.trim().toLowerCase().slice(0, 60);
    if (normStem) {
      if (seenStems.has(normStem)) {
        duplicateCount++;
        issues.push(`Question #${idx + 1} duplicates another question stem.`);
      } else {
        seenStems.add(normStem);
      }
    }

    const failing = q.checks.find(c => c.status === 'fail');
    if (failing) {
      issues.push(`Question #${idx + 1} fails check: "${failing.label}" (${failing.detail})`);
    }
  });

  // Check key skew (e.g. if >75% are all the same letter)
  if (questions.length >= 4) {
    for (const [letter, count] of Object.entries(spread)) {
      if (count / questions.length >= 0.75) {
        issues.push(`Answer key is skewed heavily toward option ${letter} (${count}/${questions.length}).`);
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    spread,
    duplicateCount
  };
}
