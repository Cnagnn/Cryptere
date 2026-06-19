import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import GlassBoxLab from '@/features/labs/ui/GlassBoxLab';
import {
    canFormatOutput,
    conceptLensByLab,
    defaultTextByLab,
    formatLabel,
    formatOptions,
    formatOutputValue,
    inputHelperByLab,
    inputLabelByLab,
    inputPlaceholderByLab,
    keyLabelByLab,
    keyPlaceholderByLab,
    modeDescription,
    normalizeInputForSimulation,
    recommendedInputFormatByLab,
    recommendedOutputFormatByLab,
    runSimulation,
    validationErrorByLab,
} from '@/lib/lab-simulations';
import { dashboard } from '@/routes';
import { index as labsIndex } from '@/routes/labs';
import type {
    AesTrace,
    FormatValue,
    LabShowProps,
    RsaKeyGenTraceData,
    RsaSignatureTraceData,
    SimulationMode,
    SimulationResult,
} from '@/types/labs';

function keySetupByLab(slug: string): string[] {
    switch (slug) {
        case 'caesar-cipher-lab':
            return [
                'Pilih angka pergeseran sebagai kunci.',
                'Angka yang sama dipakai untuk membalik pergeseran saat dekripsi.',
            ];
        case 'vigenere-cipher-lab':
            return [
                'Tentukan kata kunci berisi huruf A-Z.',
                'Setiap huruf kata kunci berubah menjadi nilai pergeseran posisi.',
            ];
        case 'aes-lab':
            return [
                'Siapkan satu kunci simetris bersama.',
                'Kunci yang sama digunakan untuk proses enkripsi dan dekripsi.',
            ];
        case 'des-lab':
            return [
                'Gunakan kunci 64-bit dalam 16 karakter hex.',
                'Kunci putaran diturunkan dari kunci utama untuk tiap putaran Feistel.',
            ];
        case 'rsa-lab':
            return [
                'Buat dua bilangan prima kecil untuk simulasi: p=61 dan q=53.',
                'Turunkan kunci publik (e, n) untuk enkripsi dan kunci privat (d, n) untuk dekripsi.',
            ];
        case 'digital-signature-lab':
            return [
                'Siapkan kunci tanda tangan sebagai representasi kunci privat.',
                'Kunci dipakai untuk membuat atau memverifikasi token tanda tangan.',
            ];
        default:
            return [
                'Tentukan parameter kunci yang dibutuhkan algoritma.',
                'Gunakan parameter yang sama atau pasangannya saat proses dibalik.',
            ];
    }
}

function labSummaryBySlug(slug: string, fallback: string): string {
    switch (slug) {
        case 'caesar-cipher-lab':
            return 'Pelajari pergeseran alfabet klasik dan bagaimana kunci angka mengubah setiap huruf.';
        case 'vigenere-cipher-lab':
            return 'Pelajari sandi berbasis kata kunci yang memakai pergeseran berbeda di tiap posisi.';
        case 'aes-lab':
            return 'Pelajari konsep kunci simetris dan pencampuran byte pada sandi blok modern.';
        case 'des-lab':
            return 'Pelajari alur Feistel dan putaran kunci pada sandi blok klasik.';
        case 'rsa-lab':
            return 'Pelajari dasar kunci publik, kunci privat, dan aritmetika modular RSA.';
        case 'digital-signature-lab':
            return 'Pelajari bagaimana pesan diringkas, ditandatangani, lalu diverifikasi.';
        default:
            return fallback;
    }
}

function conceptTitleInIndonesian(title: string): string {
    const labels: Record<string, string> = {
        'Classical Shift Cipher': 'Sandi Pergeseran Klasik',
        'Polyalphabetic Substitution': 'Substitusi Polialfabetik',
        'Symmetric Block Concept': 'Konsep Blok Simetris',
        'Asymmetric Key Exchange': 'Pertukaran Kunci Asimetris',
        'Digital Signature Flow': 'Alur Tanda Tangan Digital',
    };

    return labels[title] ?? title;
}

function translateText(value: string): string {
    const exact: Record<string, string> = {
        'Transform plaintext into protected representation.':
            'Ubah teks asli menjadi representasi terlindungi.',
        'Reverse protected representation back into readable text.':
            'Kembalikan representasi terlindungi menjadi teks yang dapat dibaca.',
        'Each letter is shifted by a constant numeric key.':
            'Setiap huruf digeser menggunakan kunci angka yang sama.',
        'Security is low because only 25 meaningful shift keys exist.':
            'Keamanannya rendah karena hanya ada 25 pergeseran bermakna.',
        'Decryption simply applies the inverse shift.':
            'Dekripsi memakai pergeseran kebalikan dari kunci.',
        'Keyword letters define changing shifts across positions.':
            'Setiap huruf kata kunci menentukan pergeseran pada posisi tertentu.',
        'Repeated keyword patterns can still leak structure.':
            'Pola kata kunci yang berulang masih dapat membocorkan struktur pesan.',
        'Decryption uses the same keyword with opposite shifts.':
            'Dekripsi memakai kata kunci yang sama dengan arah pergeseran berlawanan.',
        'Same key is used for encryption and decryption.':
            'Kunci yang sama dipakai untuk enkripsi dan dekripsi.',
        'This lab visualizes byte-level mixing as a learning approximation.':
            'Lab ini memvisualkan pencampuran byte sebagai pendekatan belajar.',
        'Real AES uses multiple rounds with substitution and permutation.':
            'AES asli memakai banyak putaran substitusi dan permutasi.',
        'Public key encrypts, private key decrypts.':
            'Kunci publik digunakan untuk enkripsi, kunci privat untuk dekripsi.',
        'Security relies on hard factorization of large integers.':
            'Keamanan bergantung pada sulitnya memfaktorkan bilangan besar.',
        'This lab uses small numbers to make modular arithmetic readable.':
            'Lab ini memakai angka kecil agar aritmetika modular mudah dibaca.',
        'A sender signs message digest with private key logic.':
            'Pengirim menandatangani ringkasan pesan dengan logika kunci privat.',
        'Receiver verifies signature using public verification logic.':
            'Penerima memverifikasi tanda tangan dengan logika verifikasi publik.',
        'Goal: authenticity, integrity, and non-repudiation.':
            'Tujuannya adalah autentisitas, integritas, dan non-repudiation.',
        Source: 'Sumber',
        Operation: 'Operasi',
        Result: 'Hasil',
        Plaintext: 'Teks asli',
        'Ciphertext (hex)': 'Ciphertext (hex)',
        'Cipher blocks': 'Blok cipher',
        'Signature token': 'Token tanda tangan',
        'Validation required': 'Validasi diperlukan',
        'Input could not be normalized for this algorithm mode.':
            'Input tidak dapat disesuaikan dengan mode algoritma ini.',
        'Enter plaintext to encrypt...':
            'Masukkan teks asli untuk dienkripsi...',
        'Enter ciphertext to decrypt...': 'Masukkan cipher untuk didekripsi...',
        'Try changing a single character and compare output differences.':
            'Ubah satu karakter untuk membandingkan perbedaan hasil.',
        'Use only hexadecimal characters (0-9, A-F) with an even number of characters.':
            'Gunakan karakter hex (0-9, A-F) dengan jumlah karakter genap.',
        'Use integer cipher blocks separated by spaces.':
            'Gunakan blok cipher berupa angka yang dipisahkan spasi.',
    };

    let translated = exact[value] ?? value;

    translated = translated
        .replace('Plain input', 'Masukan teks asli')
        .replace('Cipher input', 'Masukan cipher')
        .replace('Shift key (number)', 'Kunci pergeseran (angka)')
        .replace('Symmetric key', 'Kunci simetris')
        .replace('Signing key', 'Kunci tanda tangan')
        .replace('Key parameter', 'Parameter kunci')
        .replace('Character Shift Table', 'Tabel Pergeseran Karakter')
        .replace('Keyword-Driven Shift Map', 'Peta Pergeseran Kata Kunci')
        .replace('Byte Mixing View', 'Tampilan Pencampuran Byte')
        .replace('Modular Arithmetic Blocks', 'Blok Aritmetika Modular')
        .replace(
            'Signing and Verification Lens',
            'Tampilan Tanda Tangan dan Verifikasi',
        )
        .replace(
            'Observe each letter move by the same offset.',
            'Lihat setiap huruf bergeser dengan jarak yang sama.',
        )
        .replace(
            'Track each block as modular exponentiation is applied.',
            'Ikuti setiap blok saat eksponensiasi modular diterapkan.',
        )
        .replace(
            'Observe how digest and signature token are related.',
            'Lihat hubungan antara ringkasan pesan dan token tanda tangan.',
        )
        .replace(
            'Normalize input into uppercase alphabetic stream:',
            'Normalisasi input menjadi deretan huruf kapital:',
        )
        .replace('Step ', 'Langkah ')
        .replace('shift ', 'geser ')
        .replace(
            'Convert decoded integer codes back to characters.',
            'Ubah kode integer hasil dekripsi kembali menjadi karakter.',
        )
        .replace(
            'Ciphertext is the sequence of modular exponentiation blocks.',
            'Ciphertext adalah rangkaian blok hasil eksponensiasi modular.',
        )
        .replace(
            'Hash the original message to produce a digest.',
            'Hash pesan asli untuk membuat ringkasan.',
        )
        .replace(
            'Distribute message + signature for verification.',
            'Kirim pesan dan tanda tangan untuk diverifikasi.',
        )
        .replace(
            'Receiver checks signature using paired public logic.',
            'Penerima memeriksa tanda tangan dengan logika publik pasangannya.',
        );

    return translated;
}

function formatLabelInIndonesian(value: FormatValue): string {
    if (value === 'decimal') {
        return 'Byte desimal';
    }

    return formatLabel(value);
}

export default function LabsShow({ lab }: LabShowProps) {
    const [mode, setMode] = useState<SimulationMode>('encrypt');
    const [inputText, setInputText] = useState(defaultTextByLab(lab.slug));
    const [keyInput, setKeyInput] = useState(keyPlaceholderByLab(lab.slug));
    const [inputFormat, setInputFormat] = useState<FormatValue>('ascii');
    const [outputFormat, setOutputFormat] = useState<FormatValue>('ascii');
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [isWalkthroughPlaying, setIsWalkthroughPlaying] = useState(false);
    const [learnerMode, setLearnerMode] = useState<'pemula' | 'mahir'>('pemula');

    const conceptLens = useMemo(
        () => conceptLensByLab(lab.slug, mode),
        [lab.slug, mode],
    );
    const keySetupSteps = useMemo(() => keySetupByLab(lab.slug), [lab.slug]);

    const normalizedInput = useMemo(
        () =>
            normalizeInputForSimulation(lab.slug, mode, inputText, inputFormat),
        [inputFormat, inputText, lab.slug, mode],
    );

    const validationError = useMemo(() => {
        if (normalizedInput.error !== null) {
            return normalizedInput.error;
        }

        if (normalizedInput.value === null) {
            return 'Input tidak dapat disesuaikan dengan mode algoritma ini.';
        }

        return validationErrorByLab(
            lab.slug,
            mode,
            normalizedInput.value,
            keyInput,
        );
    }, [
        keyInput,
        lab.slug,
        mode,
        normalizedInput.error,
        normalizedInput.value,
    ]);

    const rawResult = useMemo(() => {
        if (validationError !== null) {
            return {
                outputLabel: 'Validasi diperlukan',
                output: 'Perbaiki input atau kunci untuk melihat hasil simulasi.',
                steps: [validationError],
            } as SimulationResult;
        }

        return runSimulation(
            lab.slug,
            mode,
            normalizedInput.value ?? '',
            keyInput,
        );
    }, [keyInput, lab.slug, mode, normalizedInput.value, validationError]);

    const outputPresentation = useMemo(() => {
        if (!canFormatOutput(lab.slug)) {
            return {
                value: rawResult.output,
                error: 'Output ditampilkan apa adanya karena formatnya khusus untuk lab ini.',
            };
        }

        return formatOutputValue(rawResult.output, outputFormat);
    }, [lab.slug, outputFormat, rawResult.output]);

    const recommendedInputFormat = recommendedInputFormatByLab(lab.slug, mode);
    const recommendedOutputFormat = recommendedOutputFormatByLab(
        lab.slug,
        mode,
    );
    const pageSummary = labSummaryBySlug(lab.slug, lab.summary);
    const translatedSteps = rawResult.steps.map(translateText);
    const translatedOutputLabel = translateText(rawResult.outputLabel);

    const safeActiveStepIndex = Math.min(
        activeStepIndex,
        Math.max(0, rawResult.steps.length - 1),
    );
    const showKeyInput = lab.slug !== 'rsa-lab';

    // Extract trace data for GlassBoxLab
    const rawTrace = (rawResult as { trace?: { aes?: AesTrace; des?: unknown; rsa?: RsaKeyGenTraceData; signature?: RsaSignatureTraceData } }).trace;
    const algoTrace = {
        aes: rawTrace?.aes,
        des: rawTrace?.des as Parameters<typeof GlassBoxLab>[0]['desTrace'],
        rsa: rawTrace?.rsa,
        signature: rawTrace?.signature,
    };

    useEffect(() => {
        setActiveStepIndex(0);
        setIsWalkthroughPlaying(false);
        setLearnerMode('pemula');
    }, [inputFormat, inputText, keyInput, mode, outputFormat, learnerMode]);

    useEffect(() => {
        if (!isWalkthroughPlaying || rawResult.steps.length <= 1) {
            return;
        }

        const intervalId = setInterval(() => {
            setActiveStepIndex((currentIndex) => {
                const lastStepIndex = Math.max(0, rawResult.steps.length - 1);

                if (currentIndex >= lastStepIndex) {
                    setIsWalkthroughPlaying(false);

                    return currentIndex;
                }

                return currentIndex + 1;
            });
        }, 1200);

        return () => clearInterval(intervalId);
    }, [isWalkthroughPlaying, rawResult.steps.length]);

    return (
        <>
            <Head title={`${lab.title} Lab`} />

            <div className="relative flex flex-col gap-3 px-4 pt-3 pb-4 lg:pt-3 lg:pb-4">
                <header className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-1">
                        <TypographyH1>{lab.title}</TypographyH1>
                        <TypographyMuted>{pageSummary}</TypographyMuted>
                    </div>
                    <div className="flex w-full items-center justify-start gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
                        <Tabs
                            value={mode}
                            onValueChange={(value) =>
                                setMode(value as SimulationMode)
                            }
                            className="w-full sm:w-auto"
                        >
                            <TabsList className="grid h-10 w-full grid-cols-2 sm:w-80">
                                <TabsTrigger value="encrypt" className="gap-2">
                                    Enkripsi
                                </TabsTrigger>
                                <TabsTrigger value="decrypt" className="gap-2">
                                    Dekripsi
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </header>{' '}
                <section className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                    <Card className="lg:col-span-4">
                        <CardHeader className="gap-1 pb-4">
                            <CardTitle className="flex items-center gap-2">
                                Dasar Algoritma
                            </CardTitle>
                            <CardDescription className="text-sm/6">
                                Konsep utama sebelum masuk ke operasi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium">
                                    {conceptTitleInIndonesian(
                                        conceptLens.title,
                                    )}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {translateText(
                                        modeDescription(lab.slug, mode),
                                    )}
                                </p>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                {conceptLens.points.map((point, index) => (
                                    <div
                                        key={point}
                                        className="flex gap-2 text-sm"
                                    >
                                        <Badge
                                            variant="secondary"
                                            className="mt-0.5 size-5 shrink-0 justify-center rounded-full p-0 text-[10px]"
                                        >
                                            {index + 1}
                                        </Badge>
                                        <span>{translateText(point)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-4">
                        <CardHeader className="gap-1 pb-4">
                            <CardTitle className="flex items-center gap-2">
                                Pembuatan Kunci
                            </CardTitle>
                            <CardDescription className="text-sm/6">
                                Fondasi awal sebelum pesan diproses.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                {keySetupSteps.map((step) => (
                                    <div
                                        key={step}
                                        className="flex gap-2 text-sm"
                                    >
                                        <span>{step}</span>
                                    </div>
                                ))}
                            </div>

                            {showKeyInput ? (
                                <div className="space-y-2">
                                    <Label htmlFor="lab-key">
                                        {translateText(keyLabelByLab(lab.slug))}
                                    </Label>
                                    <Input
                                        id="lab-key"
                                        value={keyInput}
                                        onChange={(event) =>
                                            setKeyInput(event.target.value)
                                        }
                                        placeholder={keyPlaceholderByLab(
                                            lab.slug,
                                        )}
                                    />
                                </div>
                            ) : (
                                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                                    <p className="font-medium">
                                        Kunci publik: (e=17, n=3233)
                                    </p>
                                    <p className="text-muted-foreground">
                                        Kunci privat: (d=2753, n=3233)
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-4">
                        <CardHeader className="gap-1 pb-4">
                            <CardTitle className="flex items-center gap-2">
                                Data dan Format
                            </CardTitle>
                            <CardDescription className="text-sm/6">
                                Siapkan pesan dan bentuk representasinya.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="lab-input">
                                    {translateText(
                                        inputLabelByLab(lab.slug, mode),
                                    )}
                                </Label>
                                <Textarea
                                    id="lab-input"
                                    value={inputText}
                                    onChange={(event) =>
                                        setInputText(event.target.value)
                                    }
                                    placeholder={translateText(
                                        inputPlaceholderByLab(lab.slug, mode),
                                    )}
                                    className="min-h-28 resize-none text-sm"
                                />
                                <p className="text-sm/6 text-muted-foreground">
                                    {translateText(
                                        inputHelperByLab(lab.slug, mode),
                                    )}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Format masukan</Label>
                                    <Select
                                        value={inputFormat}
                                        onValueChange={(value) =>
                                            setInputFormat(value as FormatValue)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formatOptions.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {formatLabelInIndonesian(
                                                        option.value,
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm/6 text-muted-foreground">
                                        Disarankan:{' '}
                                        {formatLabelInIndonesian(
                                            recommendedInputFormat,
                                        )}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Format keluaran</Label>
                                    <Select
                                        value={outputFormat}
                                        onValueChange={(value) =>
                                            setOutputFormat(
                                                value as FormatValue,
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formatOptions.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {formatLabelInIndonesian(
                                                        option.value,
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm/6 text-muted-foreground">
                                        Disarankan:{' '}
                                        {formatLabelInIndonesian(
                                            recommendedOutputFormat,
                                        )}
                                    </p>
                                </div>
                            </div>

                            {validationError && (
                                <Alert variant="destructive" className="py-3">
                                    <AlertDescription>
                                        {translateText(validationError)}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setInputText(defaultTextByLab(lab.slug));
                                    setKeyInput(keyPlaceholderByLab(lab.slug));
                                    setInputFormat('ascii');
                                    setOutputFormat('ascii');
                                    setMode('encrypt');
                                }}
                            >
                                Atur ulang
                            </Button>
                        </CardContent>
                    </Card>
                </section>
                <section className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                    <GlassBoxLab
                        slug={lab.slug}
                        steps={translatedSteps}
                        activeStep={safeActiveStepIndex}
                        onStepChange={setActiveStepIndex}
                        learnerMode={learnerMode}
                        onModeChange={setLearnerMode}
                        mode={mode}
                        aesTrace={algoTrace.aes}
                        desTrace={algoTrace.des}
                        rsaTrace={algoTrace.rsa}
                        sigTrace={algoTrace.signature}
                    />

                    <Card className="lg:col-span-4">
                        <CardHeader className="gap-1 pb-4">
                            <CardTitle className="flex items-center gap-2">
                                Hasil Akhir
                            </CardTitle>
                            <CardDescription className="text-sm/6">
                                {translatedOutputLabel} dalam format{' '}
                                {formatLabelInIndonesian(outputFormat)}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="min-h-40 rounded-lg bg-muted/40 p-3 text-sm leading-relaxed break-all">
                                {outputPresentation.value || (
                                    <span className="text-muted-foreground italic">
                                        Menunggu input...
                                    </span>
                                )}
                            </div>
                            {outputPresentation.error && (
                                <p className="text-sm/6 text-muted-foreground">
                                    {outputPresentation.error}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </>
    );
}

LabsShow.layout = {
    breadcrumbs: [
        {
            title: 'Beranda',
            href: dashboard(),
        },
        {
            title: 'Laboratorium',
            href: labsIndex(),
        },
    ],
};
