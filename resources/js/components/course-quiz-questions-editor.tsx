import { SearchableCombobox } from '@/components/course-searchable-combobox';
import {
    createEmptyQuizQuestion

} from '@/components/course-types';
import type {QuizQuestionForm} from '@/components/course-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface QuizQuestionsEditorProps {
    /** Used for React key prefixes to distinguish create vs edit instances */
    prefix: string;
    questions: QuizQuestionForm[];
    onChange: (questions: QuizQuestionForm[]) => void;
}

const CORRECT_OPTION_OPTIONS = [
    { value: '0', label: 'Option 1' },
    { value: '1', label: 'Option 2' },
    { value: '2', label: 'Option 3' },
    { value: '3', label: 'Option 4' },
];

export function QuizQuestionsEditor({
    prefix,
    questions,
    onChange,
}: QuizQuestionsEditorProps) {
    const updateQuestion = (
        index: number,
        patch: Partial<QuizQuestionForm>,
    ) => {
        const next = [...questions];
        next[index] = { ...next[index], ...patch };
        onChange(next);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const next = [...questions];
        const options = [...next[qIndex].options] as [
            string,
            string,
            string,
            string,
        ];
        options[oIndex] = value;
        next[qIndex] = { ...next[qIndex], options };
        onChange(next);
    };

    const removeQuestion = (index: number) => {
        onChange(questions.filter((_, i) => i !== index));
    };

    const addQuestion = () => {
        onChange([...questions, createEmptyQuizQuestion()]);
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Quiz Questions</p>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                >
                    Add question
                </Button>
            </div>

            {questions.map((question, qIndex) => (
                <div
                    key={`${prefix}-quiz-question-${qIndex}`}
                    className="flex flex-col gap-2 rounded-lg border p-3"
                >
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                            Question {qIndex + 1}
                        </p>
                        {questions.length > 1 ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(qIndex)}
                            >
                                Remove
                            </Button>
                        ) : null}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Question text</Label>
                        <Textarea
                            value={question.question}
                            onChange={(e) =>
                                updateQuestion(qIndex, {
                                    question: e.target.value,
                                })
                            }
                        />
                    </div>

                    <div className="grid gap-2">
                        {question.options.map((option, oIndex) => (
                            <div
                                key={`${prefix}-option-${qIndex}-${oIndex}`}
                                className="flex flex-col gap-1"
                            >
                                <Label>Option {oIndex + 1}</Label>
                                <Input
                                    value={option}
                                    onChange={(e) =>
                                        updateOption(
                                            qIndex,
                                            oIndex,
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Correct option</Label>
                        <SearchableCombobox
                            value={String(question.correct_option)}
                            options={CORRECT_OPTION_OPTIONS}
                            placeholder="Select correct option"
                            searchPlaceholder="Search option..."
                            emptyMessage="No option found."
                            className="w-full"
                            onSelect={(value) =>
                                updateQuestion(qIndex, {
                                    correct_option: Number(value),
                                })
                            }
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Explanation (optional)</Label>
                        <Textarea
                            value={question.explanation}
                            onChange={(e) =>
                                updateQuestion(qIndex, {
                                    explanation: e.target.value,
                                })
                            }
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
