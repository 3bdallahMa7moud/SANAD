import type { CareerPackage } from '@/types/domain';

const questions: Record<string, string[]> = {
  'professional cv': [
    'Which language, file formats and page count are included?',
    'Does the scope cover writing from scratch, updating an existing CV, or both?',
  ],
  'professional package': [
    'Is the cover letter tailored to one vacancy or provided as a reusable template?',
  ],
  'full package': [
    'How does the scope differ from ordering CV + Cover Letter and LinkedIn separately?',
    'Do you receive LinkedIn text to add yourself, or is implementation included?',
  ],
  'premium full package': [
    'Which documents and profile improvements are included?',
    'Which languages and file formats are included?',
  ],
  'linkedin profile optimization': [
    'Which profile sections and languages are included?',
    'Will you receive ready-to-use text and guidance, or is implementation included?',
  ],
};

// Preserve the questions while an existing database is being updated from
// the previous package names.
questions['professional distinction package'] =
  questions['professional package'];
questions['career excellence package'] = questions['full package'];
questions['golden signature package'] = questions['premium full package'];

export function getScopeQuestions(packageItem: CareerPackage): string[] {
  return (
    questions[packageItem.name.trim().toLowerCase()] ?? [
      'Which deliverables, formats and languages are included?',
      'What is outside the published scope?',
    ]
  );
}
