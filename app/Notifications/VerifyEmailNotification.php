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
            ->subject('🔐 Verify Your Email — Cryptere')
            ->greeting('Welcome to Cryptere! 🎉')
            ->line('You\'re one step away from unlocking your coding journey.')
            ->line('Please verify your email address to get started with courses, labs, and earning achievements.')
            ->action('Verify My Email', $url)
            ->line('This verification link will expire in '.Config::get('auth.verification.expire', 60).' minutes.')
            ->line('If you didn\'t create an account on Cryptere, you can safely ignore this email.')
            ->salutation('Happy coding! — The Cryptere Team');
    }
}
