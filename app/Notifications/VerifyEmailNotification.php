<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Config;

class VerifyEmailNotification extends VerifyEmail
{
    protected function buildMailMessage($url): MailMessage
    {
        return (new MailMessage)
            ->subject('🔐 Verify Your Email — Crypter')
            ->greeting('Welcome to Crypter! 🎉')
            ->line('You\'re one step away from unlocking your coding journey.')
            ->line('Please verify your email address to get started with challenges, courses, and earning achievements.')
            ->action('Verify My Email', $url)
            ->line('This verification link will expire in '.Config::get('auth.verification.expire', 60).' minutes.')
            ->line('If you didn\'t create an account on Crypter, you can safely ignore this email.')
            ->salutation('Happy coding! — The Crypter Team');
    }
}
