import { Form } from '@inertiajs/react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import PasswordInput from '@/components/password-input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';
import { Label } from '@/components/ui/label';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-0.5">
                <h2 className="text-base leading-snug font-semibold">
                    Hapus Akun
                </h2>
                <p className="text-sm text-muted-foreground">
                    Hapus akun Anda dan semua sumber dayanya
                </p>
            </div>
            <div className="flex flex-col gap-4">
                <Alert variant="destructive">
                    <AlertTitle>Peringatan</AlertTitle>
                    <AlertDescription>
                        Harap berhati-hati, tindakan ini tidak dapat dibatalkan.
                    </AlertDescription>
                </Alert>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            data-test="delete-user-button"
                        >
                            Hapus Akun
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus akun?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Setelah akun Anda dihapus, semua sumber daya dan
                                data juga akan dihapus secara permanen. Silakan
                                masukkan kata sandi Anda untuk mengonfirmasi
                                bahwa Anda ingin menghapus akun Anda secara
                                permanen.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <Form
                            {...ProfileController.destroy.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            onError={() => passwordInput.current?.focus()}
                            resetOnSuccess
                            className="flex flex-col gap-6"
                        >
                            {({ resetAndClearErrors, processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="password"
                                            className="sr-only"
                                        >
                                            Kata Sandi
                                        </Label>

                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            ref={passwordInput}
                                            placeholder="Kata Sandi"
                                            autoComplete="current-password"
                                        />

                                        <FieldError>
                                            {errors.password}
                                        </FieldError>
                                    </div>

                                    <AlertDialogFooter className="gap-2">
                                        <AlertDialogCancel
                                            onClick={() =>
                                                resetAndClearErrors()
                                            }
                                        >
                                            Batal
                                        </AlertDialogCancel>

                                        <AlertDialogAction
                                            type="submit"
                                            disabled={processing}
                                            data-test="confirm-delete-user-button"
                                        >
                                            Hapus Akun
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </>
                            )}
                        </Form>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
