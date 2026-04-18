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
import { TypographyLarge, TypographyMuted } from '@/components/ui/typography';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-0.5">
                <TypographyLarge className="text-base font-medium leading-snug">
                    Delete account
                </TypographyLarge>
                <TypographyMuted className="text-sm/6">
                    Delete your account and all of its resources
                </TypographyMuted>
            </div>
            <div className="flex flex-col gap-4">
                <Alert variant="destructive">
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                        Please proceed with caution, this cannot be undone.
                    </AlertDescription>
                </Alert>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            data-test="delete-user-button"
                        >
                            Delete account
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Delete account?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Once your account is deleted, all of its resources
                                and data will also be permanently deleted. Please
                                enter your password to confirm you would like to
                                permanently delete your account.
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
                                            Password
                                        </Label>

                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            ref={passwordInput}
                                            placeholder="Password"
                                            autoComplete="current-password"
                                        />

                                        <FieldError>{errors.password}</FieldError>
                                    </div>

                                    <AlertDialogFooter className="gap-2">
                                        <AlertDialogCancel
                                            onClick={() => resetAndClearErrors()}
                                        >
                                            Cancel
                                        </AlertDialogCancel>

                                        <AlertDialogAction
                                            type="submit"
                                            disabled={processing}
                                            data-test="confirm-delete-user-button"
                                        >
                                            Delete account
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
