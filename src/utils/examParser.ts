import * as pdfjsLib from 'pdfjs-dist';
import { DiagramKind, QuestionDraft } from '../types';
import { runQuestionChecks } from './questionChecks';

// Set up pdf.js worker URL
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
}

export const SAMPLE_TEST_FORMAT = `1. What is the SI unit of electric potential?
A) Ampere
B) Volt
C) Ohm
D) Joule
Answer: B
Explanation: The SI unit of electric potential (and electromotive force) is the volt (V), named after Alessandro Volta.

2. A body of mass 2 kg moves with velocity 5 m/s. What is its kinetic energy?
A) 10 J
B) 20 J
C) 25 J
D) 50 J
Answer: C
Explanation: Kinetic energy KE = (1/2) * m * v^2 = 0.5 * 2 * (5^2) = 25 Joules.

3. Which organelle is known as the powerhouse of the cell?
A) Nucleus
B) Ribosome
C) Mitochondria
D) Endoplasmic Reticulum
Answer: C
Explanation: Mitochondria generate most of the chemical energy needed to power the cell's biochemical reactions via ATP synthesis.`;

export function parsePastedExamText(
  rawText: string,
  subject: string,
  topic: string,
  marks = 4,
  negativeMarks = 1
): QuestionDraft[] {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const questions: QuestionDraft[] = [];

  let currentStem = '';
  let currentOptions: string[] = [];
  let currentKeyIdx = -1;
  let currentExplanation = '';
  let currentDiagramKind: DiagramKind = 'none';

  function flushCurrent() {
    if (!currentStem && currentOptions.length === 0) return;

    if (/figure|diagram|circuit|graph|lens/i.test(currentStem)) {
      if (/circuit/i.test(currentStem)) currentDiagramKind = 'circuit';
      else if (/graph|plot/i.test(currentStem)) currentDiagramKind = 'graph';
      else if (/lens|mirror/i.test(currentStem)) currentDiagramKind = 'lens';
      else currentDiagramKind = 'fbd';
    }

    const draft: QuestionDraft = {
      id: 'q_' + Math.random().toString(36).substring(2, 9),
      questionText: currentStem.trim(),
      subject,
      topic,
      difficulty: 'medium',
      options: currentOptions.length > 0 ? currentOptions : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctOptionIndex: currentKeyIdx >= 0 ? currentKeyIdx : 0,
      marks,
      negativeMarks,
      solutionExplanation: currentExplanation.trim() || 'Refer to the core conceptual derivation.',
      diagram: currentDiagramKind !== 'none' ? { kind: currentDiagramKind } : undefined,
      confidence: 90,
      checks: [],
      reviewStatus: 'pending',
      createdAt: new Date().toISOString()
    };
    draft.checks = runQuestionChecks(draft);
    questions.push(draft);

    currentStem = '';
    currentOptions = [];
    currentKeyIdx = -1;
    currentExplanation = '';
    currentDiagramKind = 'none';
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect question start: e.g. "1.", "Q1:", "Question 1:"
    const qMatch = line.match(/^(?:Q(?:uestion)?\s*\d+[\.\:]|\d+[\.\:])\s*(.*)$/i);
    if (qMatch) {
      flushCurrent();
      currentStem = qMatch[1] || '';
      continue;
    }

    // Detect options: e.g. "A)", "(A)", "A.", "[A]"
    const optMatch = line.match(/^[\(\[]?([A-Ea-e])[\)\]\.\:]\s*(.*)$/);
    if (optMatch && currentStem) {
      const letter = optMatch[1].toUpperCase();
      const optIdx = letter.charCodeAt(0) - 65;
      const optVal = optMatch[2].trim();
      currentOptions[optIdx] = optVal;
      continue;
    }

    // Detect Answer key: e.g. "Answer: B", "Ans: (C)", "Key: D"
    const ansMatch = line.match(/^(?:Answer|Ans|Key|Correct(?:\s*Option)?)\s*[:\-=]\s*[\(\[]?([A-Ea-e])[\)\]]?/i);
    if (ansMatch) {
      const letter = ansMatch[1].toUpperCase();
      currentKeyIdx = letter.charCodeAt(0) - 65;
      continue;
    }

    // Detect Explanation: e.g. "Explanation: ..." or "Solution: ..."
    const expMatch = line.match(/^(?:Explanation|Solution|Rationale)\s*[:\-=]\s*(.*)$/i);
    if (expMatch) {
      currentExplanation = expMatch[1] || '';
      continue;
    }

    // Otherwise append to current context
    if (currentExplanation) {
      currentExplanation += ' ' + line;
    } else if (currentOptions.length > 0) {
      // maybe multiline option
      const lastIdx = currentOptions.length - 1;
      currentOptions[lastIdx] += ' ' + line;
    } else if (currentStem) {
      currentStem += ' ' + line;
    }
  }

  flushCurrent();
  return questions;
}

export async function parsePdfDocument(
  file: File,
  subject: string,
  topic: string
): Promise<{ questions: QuestionDraft[]; pageCount: number; warnings: string[] }> {
  const warnings: string[] = [];
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;

  let fullText = '';
  for (let p = 1; p <= pageCount; p++) {
    const page = await pdf.getPage(p);
    const textContent = await page.getTextContent();
    const pageStr = textContent.items
      .map((item: any) => item.str || '')
      .join(' ');
    fullText += '\n' + pageStr;
  }

  if (fullText.trim().length < 50) {
    warnings.push('Extracted PDF text is sparse. If this PDF is a scanned image, use the OCR scanner route.');
  }

  const questions = parsePastedExamText(fullText, subject, topic);
  if (questions.length === 0) {
    warnings.push('Could not detect numbered questions with standard A/B/C/D format. Try pasting text manually.');
  }

  return { questions, pageCount, warnings };
}

// Algorithmic offline question generator from syllabus curriculum bank
const CURRICULUM_BANK: Record<string, Record<string, Array<{ stem: string; opts: string[]; key: number; exp: string; diagram?: DiagramKind }>>> = {
  Physics: {
    Mechanics: [
      {
        stem: 'A block of mass m is released from the top of an inclined plane of height h and angle θ. Assuming frictionless surface, what is its speed at the bottom?',
        opts: ['√(2gh)', '√(gh)', '2√(gh)', '√(2gh sin θ)'],
        key: 0,
        exp: 'From conservation of mechanical energy: mgh = (1/2)mv^2 => v = √(2gh). It is independent of the incline angle θ.',
        diagram: 'fbd'
      },
      {
        stem: 'Two masses m1 and m2 (m1 > m2) are connected by a light inextensible string passing over a frictionless pulley. What is the downward acceleration of m1?',
        opts: ['(m1 - m2)g / (m1 + m2)', '(m1 + m2)g / (m1 - m2)', '(m1 - m2)g / m1', 'g / 2'],
        key: 0,
        exp: 'Using Atwood machine equation: a = (m1 - m2)g / (m1 + m2).',
        diagram: 'fbd'
      },
      {
        stem: 'What is the work done by the centripetal force acting on a particle executing uniform circular motion of radius r in one complete revolution?',
        opts: ['Zero', '2πr * F_c', 'πr * F_c', 'F_c / r'],
        key: 0,
        exp: 'Since the centripetal force is always perpendicular to the instantaneous velocity/displacement vector, cos(90°) = 0, work done is identically zero.',
        diagram: 'none'
      }
    ],
    Electrodynamics: [
      {
        stem: 'Three identical capacitors each of capacitance C are connected in series. What is the equivalent capacitance of the network?',
        opts: ['C / 3', '3C', 'C / 2', '2C / 3'],
        key: 0,
        exp: 'In series configuration: 1/C_eq = 1/C + 1/C + 1/C = 3/C => C_eq = C / 3.',
        diagram: 'circuit'
      },
      {
        stem: 'According to Faraday\'s law of electromagnetic induction, the magnitude of induced electromotive force (EMF) is proportional to which quantity?',
        opts: ['Rate of change of magnetic flux', 'Rate of change of electric flux', 'Total magnetic field strength alone', 'Resistance of the conducting coil'],
        key: 0,
        exp: 'Faraday\'s law states that |ε| = dΦ_B / dt, the instantaneous time rate of change of magnetic flux.',
        diagram: 'wave'
      }
    ],
    Optics: [
      {
        stem: 'A convex lens of focal length 20 cm produces a real, inverted image at a distance of 30 cm from the lens. What is the object distance?',
        opts: ['-60 cm', '-12 cm', '-15 cm', '-45 cm'],
        key: 0,
        exp: 'Using lens formula 1/f = 1/v - 1/u => 1/20 = 1/30 - 1/u => 1/u = 1/30 - 1/20 = -1/60 => u = -60 cm.',
        diagram: 'lens'
      }
    ]
  },
  Chemistry: {
    Organic: [
      {
        stem: 'Which mechanism is favored when a tertiary alkyl halide reacts with a weak nucleophile in a polar protic solvent?',
        opts: ['SN1', 'SN2', 'E2', 'Electrophilic addition'],
        key: 0,
        exp: 'Tertiary carbocations are stabilized by hyperconjugation and inductive effect, favoring two-step SN1 kinetics.',
        diagram: 'none'
      },
      {
        stem: 'What is the major product obtained when propene undergoes acid-catalyzed hydration in the presence of dilute H2SO4?',
        opts: ['Propan-2-ol', 'Propan-1-ol', 'Propanoic acid', 'Propene oxide'],
        key: 0,
        exp: 'Follows Markovnikov\'s rule: H+ adds to the less substituted carbon generating a secondary carbocation, followed by water attack yielding propan-2-ol.',
        diagram: 'none'
      }
    ],
    Physical: [
      {
        stem: 'For a first-order chemical reaction, if the half-life t_1/2 is 20 minutes, what is the rate constant k?',
        opts: ['0.0346 min⁻¹', '0.0693 min⁻¹', '0.0173 min⁻¹', '0.1386 min⁻¹'],
        key: 0,
        exp: 'For first order: k = ln(2) / t_1/2 = 0.693 / 20 = 0.03465 min⁻¹.',
        diagram: 'graph'
      }
    ]
  },
  Mathematics: {
    Calculus: [
      {
        stem: 'What is the limit of (sin 3x) / (5x) as x approaches 0?',
        opts: ['3/5', '5/3', '1', '0'],
        key: 0,
        exp: 'lim_{x->0} (sin 3x)/(5x) = (3/5) * lim_{x->0} (sin 3x)/(3x) = (3/5) * 1 = 3/5.',
        diagram: 'none'
      },
      {
        stem: 'What is the derivative of f(x) = x * ln(x) with respect to x for x > 0?',
        opts: ['1 + ln(x)', 'ln(x)', '1 / x', 'x + ln(x)'],
        key: 0,
        exp: 'By product rule: f\'(x) = (d/dx[x])*ln(x) + x*(d/dx[ln(x)]) = 1*ln(x) + x*(1/x) = ln(x) + 1.',
        diagram: 'graph'
      }
    ]
  }
};

export function generateAlgoQuestions(
  subject: string,
  topic: string,
  count = 5,
  marks = 4,
  negativeMarks = 1
): QuestionDraft[] {
  const subjectBank = CURRICULUM_BANK[subject] || CURRICULUM_BANK['Physics'];
  const topics = Object.keys(subjectBank);
  const selectedTopic = topic && subjectBank[topic] ? topic : topics[0];
  const templates = subjectBank[selectedTopic] || [];

  const results: QuestionDraft[] = [];
  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    const draft: QuestionDraft = {
      id: 'algo_' + Math.random().toString(36).substring(2, 9),
      questionText: template ? template.stem : `Synthesized ${subject} problem ${i + 1} regarding ${topic}: compute equilibrium coefficient.`,
      subject,
      topic: selectedTopic,
      difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
      options: template ? [...template.opts] : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctOptionIndex: template ? template.key : 0,
      marks,
      negativeMarks,
      solutionExplanation: template ? template.exp : 'Standard algorithmic derivation applies.',
      diagram: template?.diagram && template.diagram !== 'none' ? { kind: template.diagram } : undefined,
      confidence: 65, // Algorithm scaffold triggers confidence check warning per Part 5.5!
      checks: [],
      reviewStatus: 'pending',
      createdAt: new Date().toISOString()
    };
    draft.checks = runQuestionChecks(draft);
    results.push(draft);
  }

  return results;
}
