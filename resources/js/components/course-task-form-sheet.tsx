import { useForm } from '@inertiajs/react';
import { Loader2, TriangleAlert, Upload, Link } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    store as storeTask,
    update as updateTask,
} from '@/actions/App/Http/Controllers/Admin/TaskController';
import { QuizQuestionsEditor } from '@/components/course-quiz-questions-editor';
import { SearchableCombobox } from '@/components/course-searchable-combobox';
import { createEmptyQuizQuestion } from '@/components/course-types';
import type {
    ComboboxOption,
    TaskFormData,
    TaskRow,
    TaskType,
} from '@/components/course-types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const TASK_TYPE_OPTIONS: ComboboxOption[] = [
    { value: 'video', label: 'Video' },
    { value: 'read', label: 'Baca' },
    { value: 'quiz', label: 'Kuis' },
];

type VideoSource = 'url' | 'upload';

interface TaskFormSheetProps {
    mode: 'create' | 'edit';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lessonOptions: ComboboxOption[];
    lessonCourseMap?: Record<number, number>;
    courseOptions?: ComboboxOption[];
    selectedLessonId: number;
    selectedCourseId?: number;
    showLessonFieldOnCreate?: boolean;
    showQuizQuestionsEditor?: boolean;
    /** Edit mode only */
    task?: TaskRow | null;
}

export function TaskFormSheet({
    mode,
    open,
    onOpenChange,
    lessonOptions,
    lessonCourseMap = {},
    courseOptions = [],
    selectedLessonId,
    selectedCourseId = 0,
    showLessonFieldOnCreate = true,
    showQuizQuestionsEditor = true,
    task,
}: TaskFormSheetProps) {
    const fallbackLessonId = Number(lessonOptions[0]?.value ?? 0);
    const fallbackCourseId = Number(
        courseOptions[0]?.value ?? selectedCourseId ?? 0,
    );

    const [videoSource, setVideoSource] = useState<VideoSource>('url');

    const form = useForm<TaskFormData>({
        lesson_id: selectedLessonId > 0 ? selectedLessonId : fallbackLessonId,
        title: '',
        description: '',
        type: 'video',
        video_url: '',
        video_file: null,
        document: null,
        quiz_questions: [createEmptyQuizQuestion()],
    });

    useEffect(() => {
        if (mode === 'edit' && open && task) {
            form.setData({
                lesson_id: task.lesson_id,
                title: task.title,
                description: task.description,
                type: task.type as TaskType,
                video_url: task.video_url ?? '',
                video_file: null,
                document: null,
                quiz_questions:
                    task.quiz_questions.length > 0
                        ? task.quiz_questions
                        : [createEmptyQuizQuestion()],
            });
            form.clearErrors();
            setVideoSource('url');
        }

        if (mode === 'create' && open) {
            form.setData({
                lesson_id:
                    selectedLessonId > 0 ? selectedLessonId : fallbackLessonId,
                title: '',
                description: '',
                type: 'video',
                minutes: 10,
                video_url: '',
                video_file: null,
                document: null,
                quiz_questions: [createEmptyQuizQuestion()],
            });
            form.clearErrors();
            setVideoSource('url');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fallbackLessonId, mode, open, selectedLessonId, task]);

    const [selectedCreateCourseId, setSelectedCreateCourseId] =
        useState<number>(
            selectedCourseId > 0 ? selectedCourseId : fallbackCourseId,
        );

    useEffect(() => {
        if (!open || mode !== 'create') {
            return;
        }

        const nextCourseId =
            selectedCourseId > 0 ? selectedCourseId : fallbackCourseId;
        setSelectedCreateCourseId(nextCourseId);
    }, [fallbackCourseId, mode, open, selectedCourseId]);

    const filteredLessonOptions = useMemo(() => {
        if (courseOptions.length === 0) {
            return lessonOptions;
        }

        return lessonOptions.filter((option) => {
            const lessonId = Number(option.value);

            return lessonCourseMap[lessonId] === selectedCreateCourseId;
        });
    }, [
        courseOptions.length,
        lessonCourseMap,
        lessonOptions,
        selectedCreateCourseId,
    ]);

    const handleClose = () => {
        form.reset();
        form.clearErrors();
        onOpenChange(false);
    };

    const handleTypeChange = (value: string) => {
        const selectedType = value as TaskType;
        form.setData('type', selectedType);

        if (selectedType !== 'video') {
            form.setData('video_url', '');
            form.setData('video_file', null);
        }

        if (selectedType !== 'read') {
            form.setData('document', null);
        }

        if (selectedType !== 'quiz') {
            form.setData('quiz_questions', [createEmptyQuizQuestion()]);
        }
    };

    const handleVideoSourceChange = (source: VideoSource) => {
        setVideoSource(source);

        if (source === 'url') {
            form.setData('video_file', null);
        } else {
            form.setData('video_url', '');
        }
    };

    const handleSubmit = () => {
        if (mode === 'create') {
            form.post(storeTask.url(), {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: handleClose,
            });
        } else {
            if (!task) {
                return;
            }

            form.patch(updateTask.url({ task: task.id }), {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: handleClose,
            });
        }
    };

    const isCreate = mode === 'create';

    const availableLessonOptions =
        filteredLessonOptions.length > 0
            ? filteredLessonOptions
            : lessonOptions;

    const handleCreateCourseChange = (value: string) => {
        const nextCourseId = Number(value);
        setSelectedCreateCourseId(nextCourseId);

        const lessonFromSelectedCourse = lessonOptions.find((option) => {
            const lessonId = Number(option.value);

            return lessonCourseMap[lessonId] === nextCourseId;
        });

        if (lessonFromSelectedCourse !== undefined) {
            form.setData('lesson_id', Number(lessonFromSelectedCourse.value));
        }
    };

    // Determine video processing status for display in edit mode
    const videoProcessingStatus = task?.video_processing_status;
    const isVideoProcessing =
        videoProcessingStatus === 'pending' ||
        videoProcessingStatus === 'processing';
    const isVideoFailed = videoProcessingStatus === 'failed';
    const isVideoReady =
        videoProcessingStatus === 'ready' ||
        videoProcessingStatus === 'converted';

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    handleClose();
                }
            }}
        >
            <DialogContent className="max-h-[85vh] w-full overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {isCreate ? 'Buat Tugas' : 'Edit Tugas'}
                    </DialogTitle>
                    <DialogDescription>
                        {isCreate
                            ? 'Buat tugas baru dalam topik yang dipilih.'
                            : 'Perbarui detail tugas yang dipilih.'}
                    </DialogDescription>
                </DialogHeader>

                <FieldGroup className="px-4">
                    {isCreate &&
                    showLessonFieldOnCreate &&
                    courseOptions.length > 0 ? (
                        <Field>
                            <FieldLabel>Judul Kursus</FieldLabel>
                            <FieldContent>
                                <SearchableCombobox
                                    value={String(selectedCreateCourseId)}
                                    options={courseOptions}
                                    placeholder="Pilih judul kursus"
                                    searchPlaceholder="Cari judul kursus..."
                                    emptyMessage="Judul kursus tidak ditemukan."
                                    className="w-full"
                                    onSelect={handleCreateCourseChange}
                                />
                            </FieldContent>
                        </Field>
                    ) : null}

                    {isCreate && showLessonFieldOnCreate ? (
                        <Field>
                            <FieldLabel>Topik</FieldLabel>
                            <FieldContent>
                                <SearchableCombobox
                                    value={
                                        form.data.lesson_id > 0
                                            ? String(form.data.lesson_id)
                                            : undefined
                                    }
                                    options={availableLessonOptions}
                                    placeholder="Pilih topik"
                                    searchPlaceholder="Cari topik..."
                                    emptyMessage="Topik tidak ditemukan."
                                    className="w-full"
                                    onSelect={(value) =>
                                        form.setData('lesson_id', Number(value))
                                    }
                                />
                                <FieldError>{form.errors.lesson_id}</FieldError>
                            </FieldContent>
                        </Field>
                    ) : null}

                    <Field>
                        <FieldLabel htmlFor={`${mode}-task-title`}>
                            Judul
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                id={`${mode}-task-title`}
                                value={form.data.title}
                                onChange={(e) =>
                                    form.setData('title', e.target.value)
                                }
                                aria-invalid={Boolean(form.errors.title)}
                            />
                            <FieldError>{form.errors.title}</FieldError>
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor={`${mode}-task-description`}>
                            Deskripsi
                        </FieldLabel>
                        <FieldContent>
                            <Textarea
                                id={`${mode}-task-description`}
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                                maxLength={5000}
                                rows={4}
                                aria-invalid={Boolean(form.errors.description)}
                            />
                            <FieldError>{form.errors.description}</FieldError>
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>Tipe</FieldLabel>
                        <FieldContent>
                            <SearchableCombobox
                                value={form.data.type}
                                options={TASK_TYPE_OPTIONS}
                                placeholder="Pilih tipe"
                                searchPlaceholder="Cari tipe..."
                                emptyMessage="Tipe tidak ditemukan."
                                className="w-full"
                                onSelect={handleTypeChange}
                            />
                        </FieldContent>
                    </Field>

                    {form.data.type === 'video' ? (
                        <>
                            <Field>
                                <FieldLabel>Sumber Video</FieldLabel>
                                <FieldContent>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={
                                                videoSource === 'url'
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            onClick={() =>
                                                handleVideoSourceChange('url')
                                            }
                                        >
                                            <Link className="mr-1.5 size-4" />
                                            URL YouTube
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={
                                                videoSource === 'upload'
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            onClick={() =>
                                                handleVideoSourceChange(
                                                    'upload',
                                                )
                                            }
                                        >
                                            <Upload className="mr-1.5 size-4" />
                                            Unggah File
                                        </Button>
                                    </div>
                                </FieldContent>
                            </Field>

                            {videoSource === 'url' ? (
                                <Field>
                                    <FieldLabel
                                        htmlFor={`${mode}-task-video-url`}
                                    >
                                        URL Video
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`${mode}-task-video-url`}
                                            value={form.data.video_url}
                                            placeholder="https://youtu.be/..."
                                            onChange={(e) =>
                                                form.setData(
                                                    'video_url',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <FieldError>
                                            {form.errors.video_url}
                                        </FieldError>
                                    </FieldContent>
                                </Field>
                            ) : (
                                <Field>
                                    <FieldLabel
                                        htmlFor={`${mode}-task-video-file`}
                                    >
                                        File Video
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`${mode}-task-video-file`}
                                            type="file"
                                            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                                            onChange={(e) => {
                                                form.setData(
                                                    'video_file',
                                                    e.currentTarget
                                                        .files?.[0] ?? null,
                                                );
                                            }}
                                        />
                                        <FieldDescription>
                                            Format yang didukung: MP4, WebM,
                                            MOV, AVI. Ukuran maks: 500MB.
                                        </FieldDescription>
                                        <FieldError>
                                            {form.errors.video_file}
                                        </FieldError>
                                    </FieldContent>
                                </Field>
                            )}

                            {/* Video processing status indicator (edit mode) */}
                            {!isCreate &&
                            task?.type === 'video' &&
                            videoProcessingStatus ? (
                                <div className="rounded-lg border p-3">
                                    {isVideoProcessing ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="size-4 animate-spin" />
                                            {videoProcessingStatus === 'pending'
                                                ? 'Video sedang dalam antrian untuk diproses...'
                                                : 'Mengonversi video...'}
                                        </div>
                                    ) : isVideoFailed ? (
                                        <div className="flex items-center gap-2 text-sm text-destructive">
                                            <TriangleAlert className="size-4" />
                                            Pemrosesan video gagal. Coba unggah
                                            ulang.
                                        </div>
                                    ) : isVideoReady ? (
                                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                            <span className="size-2 rounded-full bg-green-500" />
                                            Video siap untuk diputar.
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </>
                    ) : null}

                    {form.data.type === 'read' ? (
                        <Field>
                            <FieldLabel htmlFor={`${mode}-task-document`}>
                                Dokumen
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    id={`${mode}-task-document`}
                                    type="file"
                                    onChange={(e) => {
                                        form.setData(
                                            'document',
                                            e.currentTarget.files?.[0] ?? null,
                                        );
                                    }}
                                />
                                <FieldError>{form.errors.document}</FieldError>
                                {!isCreate ? (
                                    <FieldDescription>
                                        Upload dokumen baru jika ingin mengganti
                                        dokumen saat ini.
                                    </FieldDescription>
                                ) : null}
                            </FieldContent>
                        </Field>
                    ) : null}

                    {form.data.type === 'quiz' && showQuizQuestionsEditor ? (
                        <QuizQuestionsEditor
                            prefix={mode}
                            questions={form.data.quiz_questions}
                            onChange={(questions) =>
                                form.setData('quiz_questions', questions)
                            }
                        />
                    ) : null}
                </FieldGroup>

                <DialogFooter className="mt-4 sm:flex-row sm:justify-end">
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                        >
                            Batal
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        disabled={form.processing || (mode === 'edit' && !task)}
                        onClick={handleSubmit}
                    >
                        {isCreate ? 'Buat' : 'Perbarui'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
